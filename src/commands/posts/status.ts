import { Args, Flags } from '@oclif/core';
import { NotraCommand } from '../../base-command';
import { pollJob } from '../../utils/poll';
import type { GenerationStatus, GetPostGenerationResponse } from '../../types/api';
import { formatDate, renderKv } from '../../utils/output';

export default class PostsStatus extends NotraCommand {
  static override description = 'Read the status of a post-generation job.';
  static override examples = [
    '<%= config.bin %> posts status job_abc123',
    '<%= config.bin %> posts status job_abc123 --watch',
  ];

  static override args = {
    jobId: Args.string({ description: 'Generation job ID.', required: true }),
  };

  static override flags = {
    watch: Flags.boolean({ description: 'Poll until the job reaches a terminal state.' }),
    'poll-interval': Flags.integer({
      description: 'Polling interval in seconds when --watch is set.',
      default: 3,
      min: 1,
    }),
    'timeout-mins': Flags.integer({
      description: 'Maximum time to wait (minutes).',
      default: 10,
      min: 1,
    }),
  };

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(PostsStatus);

    let snapshot = await this.client().content.getPostGeneration({ jobId: args.jobId });

    if (flags.watch) {
      snapshot = await pollJob<GetPostGenerationResponse>({
        fetch: () => this.client().content.getPostGeneration({ jobId: args.jobId }),
        status: (snap) => snap.job.status as GenerationStatus,
        describe: (snap) => `Job ${args.jobId}: ${snap.job.status}`,
        intervalMs: flags['poll-interval'] * 1000,
        timeoutMs: flags['timeout-mins'] * 60 * 1000,
        spinnerLabel: `Job ${args.jobId}: ${snapshot.job.status}`,
      });
    }

    if (this.emitJson()) {
      this.printJson(snapshot);
      return;
    }

    this.log(
      renderKv([
        ['Job', snapshot.job.id],
        ['Status', snapshot.job.status],
        ['Type', snapshot.job.contentType],
        ['Lookback', snapshot.job.lookbackWindow],
        ['Post ID', snapshot.job.postId ?? '—'],
        ['Created', formatDate(snapshot.job.createdAt)],
        ['Updated', formatDate(snapshot.job.updatedAt)],
        ['Completed', formatDate(snapshot.job.completedAt)],
        ['Error', snapshot.job.error ?? '—'],
      ]),
    );
    if (snapshot.events.length > 0) {
      this.log('\nRecent events:');
      for (const ev of snapshot.events.slice(-5)) {
        this.log(`  ${formatDate(ev.createdAt)}  ${ev.type}  ${ev.message}`);
      }
    }
  }
}
