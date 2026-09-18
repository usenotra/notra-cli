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
notra api operations --tag GEO
notra api call getGeoSentiment --param projectId=project_123
```

Run `notra <topic> --help` to see every command and flag. Every command
accepts `--json` for machine-readable output.

GEO commands cover projects, settings, prompts, sequences, competitors, scans,
visibility, content gaps, briefs, agent readiness, and AI traffic. Run
`notra geo --help` to browse the complete command tree.

### Complete API access

The curated commands above optimize common workflows. The `api` commands expose
the complete public OpenAPI surface without a generated SDK:

```bash
# Browse every bundled operation
notra api operations
notra api operations --search feedback

# Call an operation by operationId
notra api call getPost --param postId=post_123
notra api call createSkill --body-file ./skill.json

# Direct escape hatch for newly deployed endpoints
notra api request GET /v1/status
notra api request GET /v1/posts --query limit=20 --query status=draft
```

Path, query, and header parameters use repeatable `--param NAME=VALUE` flags.
Request bodies come from `--body-file`; use `-` to read JSON from stdin. The raw
`api request` command remains available when an API deployment is newer than the
catalog bundled with the installed CLI.

## Output

Commands default to formatted output in a terminal and JSON when stdout is
redirected. Explicit output flags take precedence over that automatic choice;
for example, `notra posts get <postId> --markdown` always prints Markdown.
`--json` never adds tables, spinners, success text, or ANSI styling to stdout.

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
bun run openapi:sync http://localhost:3000/openapi.json
bun run test
bun run typecheck
```

Source is TypeScript with extensionless imports (`moduleResolution: Bundler`). A
small in-repo parser and dispatcher power the CLI; there is no generated SDK or
CLI framework in the runtime dependency graph. `bun run dev` executes the source
dispatcher. For distribution, `bun run build` bundles the command entrypoints
into `dist`; `prepack` runs that build automatically, and the published package
contains only `dist`.

The parser infers required, optional, repeatable, enum, integer, and boolean
types from each command definition. The shared HTTP client returns `unknown`
unless a response decoder is supplied; curated commands use Zod response
schemas, while generic `api` calls deliberately pass unknown JSON
through without pretending it has a compile-time type.

Effect is intentionally not a runtime dependency. The API backend benefits from
Effect services, typed domain errors, and schedules; this short-lived CLI mostly
performs one request and exits. A local Effect v4 experiment increased an
isolated bundled Bun startup from 2.61 ms to 6.92 ms. Effect remains a reasonable
future choice for a genuinely complex retry or concurrent workflow, but it does
not replace decoding untrusted OpenAPI responses.

`bun run openapi:sync [URL]` refreshes the bundled operation catalog. It defaults
to the production schema and accepts a local API server URL for development.
