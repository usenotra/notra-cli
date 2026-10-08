import { Flags } from '@oclif/core';
import type { GetPostGenerationResponse } from '../../types/posts';
import { NotraCommand } from '../../base-command';
import { ExitCode } from '../../constants/exit';
import { CONTENT_TYPES, LOOKBACK_WINDOWS } from '../../constants/posts';
import { validateCreatePostGenerationRequest } from '../../schemas/posts';
import { pollJob } from '../../utils/poll';
import { readJsonFromFileOrStdin } from '../../utils/files';
import { isRecord } from '../../utils/records';

export default class PostsGenerate extends NotraCommand {
  static override description = 'Queue an asynchronous post-generation job.';
  static override examples = [
    '<%= config.bin %> posts generate --content-type changelog --brand brand_xxx',
    '<%= config.bin %> posts generate --content-type blog_post --lookback last_7_days --wait',
  ];

  static override flags = {
    'content-type': Flags.string({
      description: 'Type of content to generate.',
      options: [...CONTENT_TYPES],
    }),
    brand: Flags.string({ description: 'Brand identity ID to use.' }),
    'brand-voice': Flags.string({ description: 'Brand voice ID (legacy).' }),
    lookback: Flags.string({
      description: 'Lookback window for source data.',
      options: [...LOOKBACK_WINDOWS],
    }),
    'github-integration': Flags.string({
      description: 'GitHub integration ID. Repeatable.',
      multiple: true,
    }),
    'linear-integration': Flags.string({
      description: 'Linear integration ID. Repeatable.',
      multiple: true,
    }),
    timezone: Flags.string({ description: 'IANA timezone for source activity.' }),
    'body-file': Flags.string({ description: 'Full generation request as JSON, or "-" for stdin. Flags override it.' }),
    wait: Flags.boolean({ description: 'Wait for the job to finish before returning.' }),
    'poll-interval': Flags.integer({
      description: 'Polling interval in seconds when --wait is set.',
      default: 3,
      min: 1,
    }),
    'timeout-mins': Flags.integer({
      description: 'Maximum time to wait for the job (minutes).',
      default: 10,
      min: 1,
    }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(PostsGenerate);

    const input: unknown = flags['body-file']
      ? await readJsonFromFileOrStdin(flags['body-file'], 'Expected a JSON generation request.') : {};
    if (!isRecord(input)) this.error('Request body must be a JSON object.', { exit: ExitCode.Usage });
    const requestInput: Record<string, unknown> = { ...input };
    if (flags['content-type']) requestInput.contentType = flags['content-type'];
    if (flags.timezone) requestInput.timezone = flags.timezone;
    if (flags.brand) requestInput.brandIdentityId = flags.brand;
    if (flags['brand-voice']) requestInput.brandVoiceId = flags['brand-voice'];
    if (flags.lookback) requestInput.lookbackWindow = flags.lookback;
    if (flags['github-integration']?.length || flags['linear-integration']?.length) {
      const integrations: Record<string, unknown> = isRecord(requestInput.integrations)
        ? { ...requestInput.integrations } : {};
      if (flags['github-integration']?.length) {
        integrations.github = flags['github-integration'];
        delete requestInput.repositoryIds;
        delete requestInput.github;
      }
      if (flags['linear-integration']?.length) {
        integrations.linear = flags['linear-integration'];
        delete requestInput.linearIntegrationIds;
      }
      requestInput.integrations = integrations;
    }
    const request = validateCreatePostGenerationRequest(requestInput);

    const created = await this.client().content.createPostGeneration(request);
    const jobId = created.result.job.id;

    if (!flags.wait) {
      if (this.emitJson()) {
        this.printJson({ jobId, job: created.result.job });
      } else {
        this.printSuccess(`Queued generation job ${jobId}.`);
        this.log('Track progress: notra posts status ' + jobId);
      }
      return;
    }

    const final = await pollJob<GetPostGenerationResponse>({
      fetch: () => this.client().content.getPostGeneration({ jobId }),
      status: (snap) => snap.job.status,
      describe: (snap) =>
        `Job ${jobId}: ${snap.job.status}` +
        (snap.events.length > 0 ? ` (${snap.events[snap.events.length - 1]?.type})` : ''),
      intervalMs: flags['poll-interval'] * 1000,
      timeoutMs: flags['timeout-mins'] * 60 * 1000,
      spinnerLabel: `Job ${jobId}: queued`,
    });

    if (this.emitJson()) {
      this.printJson(final);
      if (final.job.status === 'failed') process.exitCode = ExitCode.Generic;
      return;
    }
    if (final.job.status === 'completed' && final.job.postId) {
      this.printSuccess(`Created post ${final.job.postId}.`);
    } else if (final.job.status === 'failed') {
      this.error(final.job.error ?? 'Generation failed.', { exit: ExitCode.Generic });
    } else {
      this.log(`Final status: ${final.job.status}`);
    }
  }
}
