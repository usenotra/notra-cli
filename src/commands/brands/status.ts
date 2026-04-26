import { Args, Flags } from '@oclif/core';
import { NotraCommand } from '../../base-command';
import { pollJob } from '../../utils/poll';
import type { GenerationStatus, GetBrandIdentityGenerationResponse } from '../../types/api';
import { formatDate, renderKv } from '../../utils/output';

export default class BrandsStatus extends NotraCommand {
  static override description = 'Read the status of a brand-identity generation job.';
  static override examples = [
    '<%= config.bin %> brands status job_abc123',
    '<%= config.bin %> brands status job_abc123 --watch',
  ];

  static override args = {
    jobId: Args.string({ description: 'Generation job ID.', required: true }),
  };

  static override flags = {
    watch: Flags.boolean({ description: 'Poll until the job reaches a terminal state.' }),
    'poll-interval': Flags.integer({ default: 3, min: 1 }),
    'timeout-mins': Flags.integer({ default: 10, min: 1 }),
  };

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(BrandsStatus);

    let snap = await this.client().content.getBrandIdentityGeneration({ jobId: args.jobId });

    if (flags.watch) {
      snap = await pollJob<GetBrandIdentityGenerationResponse>({
        fetch: () => this.client().content.getBrandIdentityGeneration({ jobId: args.jobId }),
        status: (s) => s.job.status as GenerationStatus,
        describe: (s) => `Job ${args.jobId}: ${s.job.status}`,
        intervalMs: flags['poll-interval'] * 1000,
        timeoutMs: flags['timeout-mins'] * 60 * 1000,
        spinnerLabel: `Job ${args.jobId}: ${snap.job.status}`,
      });
    }

    if (this.emitJson()) {
      this.printJson(snap);
      return;
    }
    this.log(
      renderKv([
        ['Job', snap.job.id],
        ['Status', snap.job.status],
        ['Step', snap.job.step ?? '—'],
        ['Progress', `${snap.job.currentStep}/${snap.job.totalSteps}`],
        ['Brand ID', snap.job.brandIdentityId],
        ['Created', formatDate(snap.job.createdAt)],
        ['Updated', formatDate(snap.job.updatedAt)],
        ['Completed', formatDate(snap.job.completedAt)],
        ['Error', snap.job.error ?? '—'],
      ]),
    );
  }
}
