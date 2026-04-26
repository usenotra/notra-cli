import { Flags } from '@oclif/core';
import { NotraCommand } from '../../base-command';
import type { CreateGitHubIntegrationRequest } from '../../types/api';

export default class IntegrationsGithub extends NotraCommand {
  static override description = 'Connect a GitHub repository as an integration.';
  static override examples = [
    '<%= config.bin %> integrations github --owner acme --repo website',
    '<%= config.bin %> integrations github --owner acme --repo website --branch develop',
  ];

  static override flags = {
    owner: Flags.string({ description: 'GitHub owner (user or organization).', required: true }),
    repo: Flags.string({ description: 'Repository name.', required: true }),
    branch: Flags.string({ description: 'Branch to track. Defaults to the repo default.' }),
    token: Flags.string({
      description: 'Personal access token, only needed for private repos without an installed app.',
    }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(IntegrationsGithub);

    const request: CreateGitHubIntegrationRequest = {
      owner: flags.owner,
      repo: flags.repo,
    };
    if (flags.branch !== undefined) request.branch = flags.branch;
    if (flags.token !== undefined) request.token = flags.token;

    const response = await this.client().content.createGitHubIntegration(request);
    if (this.emitJson()) {
      this.printJson(response.result);
      return;
    }
    this.printSuccess(
      `Connected ${response.result.github.displayName} (${response.result.github.id}).`,
    );
  }
}
