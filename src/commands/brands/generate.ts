import { Flags } from '@oclif/core';
import { NotraCommand } from '../../base-command';
import { pollJob } from '../../utils/poll';
import type {
  CreateBrandIdentityRequest,
  GenerationStatus,
  GetBrandIdentityGenerationResponse,
} from '../../types/api';

export default class BrandsGenerate extends NotraCommand {
  static override description = 'Queue an asynchronous brand-identity generation from a website URL.';
  static override examples = [
    '<%= config.bin %> brands generate --website-url https://acme.com',
    '<%= config.bin %> brands generate --website-url https://acme.com --name Acme --wait',
  ];

  static override flags = {
    'website-url': Flags.string({ description: 'Website URL to analyse.', required: true }),
    name: Flags.string({ description: 'Optional name for the new brand identity.' }),
    wait: Flags.boolean({ description: 'Wait for the job to finish before returning.' }),
    'poll-interval': Flags.integer({ default: 3, min: 1 }),
    'timeout-mins': Flags.integer({ default: 10, min: 1 }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(BrandsGenerate);

    const request: CreateBrandIdentityRequest = { websiteUrl: flags['website-url'] };
    if (flags.name) request.name = flags.name;

    const created = await this.client().content.createBrandIdentity(request);
    const jobId = created.result.job.id;

    if (!flags.wait) {
      if (this.emitJson()) this.printJson({ jobId, job: created.result.job });
      else {
        this.printSuccess(`Queued brand-identity job ${jobId}.`);
        this.log('Track progress: notra brands status ' + jobId);
      }
      return;
    }

    const final = await pollJob<GetBrandIdentityGenerationResponse>({
      fetch: () => this.client().content.getBrandIdentityGeneration({ jobId }),
      status: (snap) => snap.job.status as GenerationStatus,
      describe: (snap) =>
        `Job ${jobId}: ${snap.job.status}` +
        (snap.job.step ? ` (${snap.job.step} ${snap.job.currentStep}/${snap.job.totalSteps})` : ''),
      intervalMs: flags['poll-interval'] * 1000,
      timeoutMs: flags['timeout-mins'] * 60 * 1000,
      spinnerLabel: `Job ${jobId}: queued`,
    });

    if (this.emitJson()) this.printJson(final);
    else if (final.job.status === 'completed') {
      this.printSuccess(`Created brand identity ${final.job.brandIdentityId}.`);
    } else if (final.job.status === 'failed') {
      this.error(final.job.error ?? 'Generation failed.', { exit: 1 });
    } else this.log(`Final status: ${final.job.status}`);
  }
}
