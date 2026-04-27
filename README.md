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

Opens the dashboard in your browser, asks you to pick an organization,
mints an API key, and saves it locally. No copy-pasting tokens.

## Commands

```bash
notra posts list
notra posts get <postId>
notra posts generate --content-type changelog --brand <id> --wait
notra brands list
notra integrations list
notra schedules list
```

Run `notra <topic> --help` to see every command and flag. Every command
accepts `--json` for machine-readable output.

## Config

The local config file lives at the OS-standard config path. Show it with:

```bash
notra config path
```

Environment overrides:

| Var | Default | Purpose |
|---|---|---|
| `NOTRA_API_KEY` | – | API key for requests |
| `NOTRA_BASE_URL` | `https://api.usenotra.com` | API base URL |
| `NOTRA_DASHBOARD_URL` | `https://app.usenotra.com` | Dashboard used by `auth login` |

Or persist them:

```bash
notra config set api-key sk_live_xxx
notra config set dashboard-url http://localhost:3000
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

Source is TypeScript with extensionless imports (`moduleResolution: Bundler`),
executed directly by Bun via the `dist/run.js` shebang. No build step.
