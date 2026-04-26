import { Flags } from '@oclif/core';
import { NotraCommand } from '../../base-command';
import { pollJob } from '../../utils/poll';
import type {
  CreatePostGenerationRequest,
  GenerationStatus,
  GetPostGenerationResponse,
} from '../../types/api';

const CONTENT_TYPES = ['changelog', 'blog_post', 'linkedin_post', 'twitter_post'] as const;
const LOOKBACK_WINDOWS = [
  'current_day',
  'yesterday',
  'last_7_days',
  'last_14_days',
  'last_30_days',
] as const;

export default class PostsGenerate extends NotraCommand {
  static override description = 'Queue an asynchronous post-generation job.';
  static override examples = [
    '<%= config.bin %> posts generate --content-type changelog --brand brand_xxx',
    '<%= config.bin %> posts generate --content-type blog_post --lookback last_7_days --wait',
  ];

  static override flags = {
    'content-type': Flags.string({
      description: 'Type of content to generate.',
      required: true,
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

    const request: CreatePostGenerationRequest = {
      contentType: flags['content-type'] as CreatePostGenerationRequest['contentType'],
    };
    if (flags.brand) request.brandIdentityId = flags.brand;
    if (flags['brand-voice']) request.brandVoiceId = flags['brand-voice'];
    if (flags.lookback) {
      request.lookbackWindow = flags.lookback as CreatePostGenerationRequest['lookbackWindow'];
    }
    if (flags['github-integration']?.length || flags['linear-integration']?.length) {
      request.integrations = {};
      if (flags['github-integration']?.length) {
        request.integrations.github = flags['github-integration'];
      }
      if (flags['linear-integration']?.length) {
        request.integrations.linear = flags['linear-integration'];
      }
    }

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
      status: (snap) => snap.job.status as GenerationStatus,
      describe: (snap) =>
        `Job ${jobId}: ${snap.job.status}` +
        (snap.events.length > 0 ? ` (${snap.events[snap.events.length - 1]?.type})` : ''),
      intervalMs: flags['poll-interval'] * 1000,
      timeoutMs: flags['timeout-mins'] * 60 * 1000,
      spinnerLabel: `Job ${jobId}: queued`,
    });

    if (this.emitJson()) {
      this.printJson(final);
      return;
    }
    if (final.job.status === 'completed' && final.job.postId) {
      this.printSuccess(`Created post ${final.job.postId}.`);
    } else if (final.job.status === 'failed') {
      this.error(final.job.error ?? 'Generation failed.', { exit: 1 });
    } else {
      this.log(`Final status: ${final.job.status}`);
    }
  }
}
