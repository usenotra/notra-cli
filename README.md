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

Starts a WorkOS Connect authorization-code flow with PKCE: the CLI opens
the sign-in and consent page in your browser, where you choose a workspace
and access level. A temporary callback listens only on `127.0.0.1` and
checks the login state before exchanging the code. Tokens are saved locally
with owner-only file permissions and refreshed automatically. No copy-pasting
tokens or embedding client secrets.

The CLI automatically registers and caches a public Connect client. No WorkOS
dashboard setup is needed when dynamic client registration is enabled.
Use `notra auth login --no-browser` to open the printed URL manually **on the
same computer**. For SSH/headless use, forward the printed callback port or
use an organization-scoped API key. The callback closes after ten minutes.

The hosted device-code page currently does not preserve the external-auth
context with Notra's Standalone Connect login, so the CLI uses the same
authorization-code flow as MCP clients rather than sending you to that page.
Sessions from the old AuthKit device flow require signing in again.

## Commands

```bash
notra posts list
notra posts get <postId>
notra posts create --title "Ship notes" --content-type changelog --markdown-file ./post.md
notra posts generate --content-type changelog --brand <id> --wait
notra posts schedule <postId> --scheduled-at 2027-01-01T08:00:00Z --time-zone Europe/Berlin
notra posts schedule-get <postId>
notra whoami
notra workspaces list
notra brands list
notra integrations list
notra schedules list
notra event-triggers list
notra webhooks endpoints list
notra webhooks deliveries list --status failed
notra chats list
notra chats create --message "What shipped this week?" --yes
notra skills list
notra feedback list --status new
notra agents list
notra geo projects list
notra geo snapshot <projectId> --days 30
notra geo visibility overview <projectId> --days 30
notra geo prompts create <projectId> --prompt "Which tools lead this category?"
notra api operations --tag GEO
notra api call getGeoSentiment --param projectId=project_123
```

Run `notra <topic> --help` to see every command and flag. Every command
accepts `--json` for machine-readable output.

GEO commands cover projects, settings, prompts, sequences, competitors, scans,
visibility, sentiment, scan changes, prompt history, citation shelf sources,
content gaps, briefs, agent readiness, and AI traffic. Run
`notra geo --help` to browse the complete command tree.

### Content and workspace workflows

| Command group | Available workflows |
|---|---|
| `posts` | List, get, create, update, delete, generate, generation status; schedule, inspect or cancel publishing |
| `event-triggers` | List, get, create, replace configuration, delete |
| `webhooks endpoints` | List, create, delete subscriptions |
| `webhooks deliveries` | List, inspect payload and attempts, retry failed deliveries |
| `chats` | List, get, find by external channel, create, send messages or tool approvals |
| `skills` | List, get, create, update or rename, delete |
| `feedback` | List, get, update triage status, submit with a key or to a public organization URL |
| `agents` | List durable sessions, create, send messages or input responses, stream events |
| `whoami`, `workspaces list` | Inspect the current workspace and discover accepted or pending memberships |

Workspace discovery does not switch credentials. To use another workspace,
authenticate for that workspace or pass its organization-scoped API key.

New commands with JSON bodies accept individual field flags or `--body-file` with a JSON
object; field flags override values in that file. Use `--body-file -` for stdin.
Object and complex-array flags accept JSON. String-array flags such as `--events`
are repeatable. Boolean fields support `--no-<flag>` to send an explicit `false`.

```bash
notra event-triggers create --body-file ./trigger.json
notra webhooks endpoints create --url https://example.com/hooks \
  --events post.created --events post.published
notra skills create --name humanizer --description "Write naturally" --content-file ./SKILL.md
notra skills update humanizer --new-name natural-writing
notra feedback submit-public acme --message "Search timed out" --kind bug
notra agents events <sessionId> --start-index 7 --timeout 300
```

Webhook creation returns a signing secret only once. Store it securely. Post
publishing schedules are separate from recurring content-generation `schedules`.
Deleting resources or cancelling publishing requires confirmation; use `--yes`
in scripts. Creating chats, sending chat messages or tool approvals, and starting
or continuing durable agent sessions also require confirmation because they use
AI credits and their tools may act on data or external services.

Chat commands return `{ "chatId": "…", "text": "…" }` after reading the reply
stream. When tools need approval, `pendingApprovals` includes their IDs, tool-call
IDs, and available tool inputs so you can inspect them before sending
`--approvals '[{"id":"approval_123","approved":true}]'` to `chats message`.
Automatic or already-answered approvals are not reported as pending.
Their default timeout is 300 seconds. `agents events` prints live NDJSON,
supports `--start-index` for replay, and stops after `--timeout` seconds (default
30). Each event is limited to 1 MiB of UTF-8 JSON; malformed or oversized events
fail the command rather than being returned as strings. Pending tool approvals
or questions can be answered with `--body-file` on
`chats message` or `agents message`.

`posts generate --body-file` accepts full source selection, including GitHub
repositories, data-point toggles, selected commits/PRs/releases/Linear issues,
and timezone. Existing generation flags override those fields. Integration
flags replace alternative selectors for the same source: `--github-integration`
replaces `github.repositories` and legacy `repositoryIds`, while
`--linear-integration` replaces legacy `linearIntegrationIds`. Conflicting
selectors in a JSON body without an override are rejected locally.

### GEO diagnostics

```bash
notra geo changes <projectId>
notra geo prompts history <projectId> <promptId> --scan-id <scanId>
notra geo visibility prompt-summaries <projectId> --limit 20 --mentioned false
notra geo visibility prompt-detail <projectId> <checkId>
notra geo sentiment get <projectId> --days 30
notra geo sentiment analysis <projectId> --days 30
notra geo sentiment evidence <projectId> --cursor <cursor>
notra geo shelf list <projectId> --offset 0 --limit 20
```

Use compact prompt summaries before fetching full answers. `geo snapshot`
combines eight read-only signals into a bounded diagnosis with recommended next
actions. Optional sections have a five-second timeout and become warnings when
unavailable; a failed visibility overview still fails the command. Stored
sentiment analysis does not start a billed analysis run.

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
compact object per line. The `pending` event contains `flow: "authorization_code"`,
`authorizationUrl` and `expiresIn`, followed by either a `ready` event or an
`error` event. JSON mode does not open the browser automatically.

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
| `NOTRA_WORKOS_CLIENT_ID` | automatically registered | Optional public **Connect application** client ID, not the WorkOS environment client ID; its redirect settings must permit the loopback callback |
| `NOTRA_OAUTH_ISSUER` | `https://oauth.usenotra.com` | Connect authorization server for dev/staging; HTTPS required except for loopback test servers |

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
unless a response decoder is supplied. Commands with modeled responses use Zod
response schemas; other commands, including generic `api` calls, return the API
payload without pretending it has a compile-time type.

Effect is intentionally not a runtime dependency. The API backend benefits from
Effect services, typed domain errors, and schedules; this short-lived CLI mostly
performs one request and exits. A local Effect v4 experiment increased an
isolated bundled Bun startup from 2.61 ms to 6.92 ms. Effect remains a reasonable
future choice for a genuinely complex retry or concurrent workflow, but it does
not replace decoding untrusted OpenAPI responses.

`bun run openapi:sync [URL|FILE]` refreshes the bundled operation catalog and
request schemas together in `src/constants/openapi.ts`, using one atomic file
replacement. It defaults to production and accepts a local API server URL or
saved OpenAPI JSON file. New curated API commands derive field flags and
validation from these schemas; no SDK is required. Domain-specific request rules
live in `src/schemas/` and are supplied to the command factory via `bodySchema`,
rather than added as operation-ID branches in the shared command runner.

`bun run test` builds the package and tests every new API command against a local
mock server from both TypeScript/Bun and the packaged JavaScript/Node entrypoint.
It also checks help for every command, validation, authentication, confirmation,
stdin/file inputs, streaming, timeouts, API errors, and GEO snapshot fallbacks.
Tests do not modify production data or spend AI credits.
