import { confirm } from '@inquirer/prompts';

export async function confirmDestructive(
  message: string,
  opts: { yes?: boolean; defaultAnswer?: boolean } = {},
): Promise<boolean> {
  return confirmAction(message, opts);
}

export async function confirmAction(
  message: string,
  opts: { yes?: boolean; defaultAnswer?: boolean } = {},
): Promise<boolean> {
  if (opts.yes) return true;
  if (!process.stdout.isTTY) return false;
  return confirm({ message, default: opts.defaultAnswer ?? false });
}
