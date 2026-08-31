import { setTimeout as sleep } from 'node:timers/promises';
import { Args, Flags } from '@oclif/core';
import { NotraCommand } from '../../../base-command';
import { ExitCode } from '../../../constants/exit';

export default class GeoScansStart extends NotraCommand {
  static override description = 'Start a GEO scan for a project.';

  static override args = {
    projectId: Args.string({ description: 'GEO project ID.', required: true }),
  };

  static override flags = {
    wait: Flags.boolean({ description: 'Wait for the scan to finish before returning.' }),
    'poll-interval': Flags.integer({
      description: 'Polling interval in seconds when --wait is set.',
      default: 3,
      min: 1,
    }),
    'timeout-mins': Flags.integer({
      description: 'Maximum time to wait for the scan in minutes.',
      default: 10,
      min: 1,
    }),
  };

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(GeoScansStart);
    const projectId = encodeURIComponent(args.projectId);
    const created = await this.geo().request(
      'POST',
      `/v1/projects/${projectId}/geo/scans`,
      {},
    );

    if (!flags.wait) {
      this.printJson(created);
      return;
    }

    if (
      typeof created !== 'object' ||
      created === null ||
      !('scanId' in created) ||
      typeof created.scanId !== 'string'
    ) {
      throw new Error('The scan response did not include a scan ID.');
    }

    const scanId = encodeURIComponent(created.scanId);
    const startedAt = Date.now();

    while (true) {
      if (Date.now() - startedAt >= flags['timeout-mins'] * 60_000) {
        throw new Error(`Scan polling timed out after ${flags['timeout-mins']} minutes.`);
      }

      const remainingMs = flags['timeout-mins'] * 60_000 - (Date.now() - startedAt);
      const response = await this.geo().request(
        'GET',
        `/v1/projects/${projectId}/geo/scans/${scanId}`,
        { timeoutMs: Math.max(1, remainingMs) },
      );

      if (
        typeof response !== 'object' ||
        response === null ||
        !('scan' in response) ||
        typeof response.scan !== 'object' ||
        response.scan === null ||
        !('status' in response.scan) ||
        typeof response.scan.status !== 'string'
      ) {
        throw new Error('The scan status response did not include a status.');
      }

      if (response.scan.status !== 'running') {
        this.printJson(response);
        if (response.scan.status === 'failed') process.exitCode = ExitCode.Generic;
        return;
      }

      const sleepMs = Math.min(
        flags['poll-interval'] * 1000,
        Math.max(0, flags['timeout-mins'] * 60_000 - (Date.now() - startedAt)),
      );
      await sleep(sleepMs);
    }
  }
}
