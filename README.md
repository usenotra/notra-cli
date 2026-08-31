# Notra

Command-line interface for the [Notra](https://www.usenotra.com) API.

## Install

```bash
bun add -g notra
# or
npm i -g notra
```

## Sign in

```bash
notra auth login
```

Starts an OAuth device authorization flow: the CLI prints a short
verification code, opens the sign-in page in your browser, and waits for
you to approve the code. Tokens are saved locally and refreshed
automatically. No copy-pasting tokens.

## Commands

```bash
notra posts list
notra posts get <postId>
notra posts generate --content-type changelog --brand <id> --wait
notra brands list
notra integrations list
notra schedules list
notra geo projects list
notra geo visibility overview <projectId> --days 30
notra geo prompts create <projectId> --prompt "Which tools lead this category?"
```

Run `notra <topic> --help` to see every command and flag. Every command
accepts `--json` for machine-readable output.

GEO commands cover projects, settings, prompts, sequences, competitors, scans,
visibility, content gaps, briefs, agent readiness, and AI traffic. Run
`notra geo --help` to browse the complete command tree.

## Output

Commands default to formatted output in a terminal and JSON when stdout is
redirected. Explicit output flags take precedence over that automatic choice;
for example, `notra posts get <postId> --markdown` always prints Markdown.

`notra auth login --json` streams newline-delimited JSON (NDJSON), with one
compact object per line. The `pending` event contains the verification URL and
code, followed by either a `ready` event or an `error` event.

## Config

The local config file lives at the OS-standard config path. Show it with:

```bash
notra config path
```

Environment overrides:

| Var | Default | Purpose |
|---|---|---|
| `NOTRA_API_KEY` | – | API key for requests (bypasses `auth login`) |
| `NOTRA_BASE_URL` | `https://api.usenotra.com` | API base URL |
| `NOTRA_WORKOS_CLIENT_ID` | production client id | Auth client id override for dev/staging |

Or persist them:

```bash
notra config set api-key sk_live_xxx
notra config set base-url https://api.usenotra.com
```

## Exit codes

| Code | Meaning |
|---|---|
| 0 | Success |
| 1 | Generic failure |
| 2 | Usage error (bad flag, missing required) |
| 3 | Auth failure (no key, 401, 403) |
| 4 | Rate-limited (429) |
| 5 | Not found (404, missing resource) |
| 6 | Network failure |

## Develop

```bash
git clone https://github.com/usenotra/notra-cli && cd notra-cli
bun install
bun run dev -- posts list --help
bun run typecheck
```

Source is TypeScript with extensionless imports (`moduleResolution: Bundler`).
`bun run dev` runs commands through oclif's development mode. For distribution,
`bun run build` bundles the command entrypoints into `dist`; `prepack` runs that
build automatically, and the published package contains only `dist`.
