import { Args, Flags } from '@oclif/core';
import chalk from 'chalk';
import { NotraCommand } from '../../base-command';
import { NOTRA_ORGANIZATION_ID_ENV_VAR } from '../../constants/config';
import { ExitCode } from '../../constants/exit';
import { clearConfigValue, setConfigValue } from '../../lib/config';
import { workspacesResponseSchema } from '../../schemas/workspaces';
import { withAuthLock } from '../../utils/auth-lock';
import { apiResponseDecoder } from '../../utils/parse-api-response';
import { sanitizeTerminalText } from '../../utils/output';

export default class WorkspacesUse extends NotraCommand {
  static override description =
    'Choose the workspace an account API key acts on. OAuth sessions stay bound to the workspace picked at sign-in.';
  static override examples = [
    '<%= config.bin %> workspaces use acme',
    '<%= config.bin %> workspaces use org_123',
    '<%= config.bin %> workspaces use --clear',
  ];

  static override args = {
    workspace: Args.string({ description: 'Workspace ID or slug.', required: false }),
  };

  static override flags = {
    clear: Flags.boolean({ description: 'Forget the saved workspace.' }),
  };

  // Clearing is local, and OAuth sessions are refused before any request, so a
  // failing token refresh must not block this command.
  protected override requiresFreshAccessToken = false;

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(WorkspacesUse);

    if (flags.clear) {
      if (args.workspace) this.error('Pass a workspace or --clear, not both.', { exit: ExitCode.Usage });
      await withAuthLock(() => clearConfigValue('organization-id'));
      if (this.emitJson()) this.printJson({ status: 'cleared' });
      else this.printSuccess('Cleared the saved workspace.');
      return;
    }
    if (!args.workspace) {
      this.error('Missing workspace. Pass a workspace ID or slug, or --clear.', { exit: ExitCode.Usage });
    }
    if (this.usesOAuthSession()) {
      this.error(
        'Your OAuth session is bound to the workspace chosen at sign-in. Run `notra auth login` and pick another workspace, or use an account API key.',
        { exit: ExitCode.Usage },
      );
    }

    const { workspaces } = await this.unscopedAuthenticatedApi().request('GET', '/v1/me/workspaces', {
      decode: apiResponseDecoder(workspacesResponseSchema, 'workspace list'),
    });
    const target = workspaces.find(
      (workspace) => workspace.id === args.workspace || workspace.slug === args.workspace,
    );
    if (!target) {
      this.error(
        `No workspace "${args.workspace}" for these credentials. Run \`notra workspaces list\` to see the available workspaces.`,
        { exit: ExitCode.NotFound },
      );
    }

    await withAuthLock(() => setConfigValue('organization-id', target.id));
    if (this.emitJson()) {
      this.printJson({ status: 'set', organizationId: target.id, slug: target.slug, name: target.name });
      return;
    }
    this.printSuccess(sanitizeTerminalText(`Using workspace ${target.name} (${target.slug}, ${target.id}).`));
    const envOverride = process.env[NOTRA_ORGANIZATION_ID_ENV_VAR]?.trim();
    if (envOverride && envOverride !== target.id) {
      this.log(chalk.yellow(`${NOTRA_ORGANIZATION_ID_ENV_VAR} is set to ${sanitizeTerminalText(envOverride)} and takes precedence over this choice.`));
    }
  }
}
