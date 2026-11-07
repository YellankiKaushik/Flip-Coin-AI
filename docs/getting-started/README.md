# Reproduce SwitchForge on Windows x64

## 1. Install the pinned tools

Use **Windows x64**, **Node 24.16.0**, **npm 11.9.0**, Git and Windows `tar`. Use PowerShell. The lockfile selects Playwright, which installs its matching Chromium. The oasdiff installer checks both the downloaded archive and the extracted executable against the pinned hashes. The demo uses synthetic checkout data. Keep credentials and real customer or payment data out of the checkout and chat.

For the chat workflow, start Docker Desktop for the bundled Mattermost setup used in this demo. You also need Switch Console and a separately configured Codex provider. The standalone CLI checks below use only local tools and synthetic inputs. [Switch and Mattermost setup](../switch/SWITCH_GUIDE.md)

```powershell
git clone https://github.com/YellankiKaushik/Flip-Coin-AI.git
cd Flip-Coin-AI
node --version
npm --version
npm ci
npm exec -- playwright install chromium
powershell -NoProfile -File scripts/install-oasdiff.ps1
npm --silent run sf -- doctor --json
npm test
```

Confirm `node --version` prints `v24.16.0` and `npm --version` prints `11.9.0` before installing. Doctor should exit zero with `ok: true`. Run doctor again through the agent before asking it to verify a candidate. The terminal and provider may resolve different executables or browser caches.

## 2. Run an unreviewed diagnostic

From this checkout root, freeze the defective scenario and use its returned snapshot ID. This uses a fresh idempotency key and creates local synthetic evidence. It requires no attestation.

```powershell
$candidate = npm --silent run sf -- prepare --scenario defective --candidate checkout-demo --json | ConvertFrom-Json
if (-not $candidate.ok) { throw $candidate.error.message }
$runKey = 'diagnostic-' + [Guid]::NewGuid().ToString('N')
$run = npm --silent run sf -- run --snapshot $candidate.data.snapshotId --key $runKey --json | ConvertFrom-Json
if (-not $run.ok) { throw $run.error.message }
$run.data.results | Select-Object checkId,status,coverage
npm --silent run sf -- verify-evidence --run $run.data.run.runId --json
npm --silent run sf -- report --run $run.data.run.runId --json
```

| What you see                                                                                 | How to read it                                                                                                                   |
| -------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Doctor returns a dependency error or the process never starts                                | Fix the runner environment before relying on a verification run.                                                                 |
| AcceptanceRelay reports `ERROR` and ReleaseProof reports `BLOCKED` on an unreviewed checkout | Expected fail-closed result. The criteria and tests need actual review. The other checks can still reveal the synthetic defects. |
| Evidence is incomplete, corrupt or inconsistent, or a mandatory check fails                  | ReleaseProof blocks. A successful CLI call or valid artifact hashes alone do not establish readiness.                            |
| `READY_FOR_HUMAN_APPROVAL`                                                                   | Four passing checks and valid evidence met the technical gate. A separate human readiness decision is required.                  |
| An effective state of `EXPIRED`                                                              | The recorded decision remains in history. It has expired under policy.                                                           |

Follow the [human review procedure](../human-review/PROCEDURE.md) for a reviewed defective run and then the separately reviewed correction. Use actual returned IDs. [Completed demo](../hackathon/DEMO.md)

## 3. Troubleshoot the environment

- **Wrong Node or npm.** Use `Get-Command node,npm -All` and compare selected versions in your terminal and the actual agent environment. The provider can resolve a different npm wrapper. Use the exact pinned entry point approved for that runner and rerun doctor.
- **Chromium missing or inaccessible.** Install with the locked Playwright package. If the provider cannot read the default browser location, set `PLAYWRIGHT_BROWSERS_PATH` to an operator-selected project-local cache before installing and pass the same setting to the real provider process. Doctor still checks the resolved executable and its hash.
- **oasdiff install or checksum error.** Check download access to the pinned release and rerun the installer. Keep both hash checks and the pinned version.
- **Wrong project root or denied launch.** Confirm the runner directory contains `package.json`, `config/` and `fixtures/`. Compare the agent's actual launch error with local doctor. Use the [runner boundary](../switch/switchforge-runner.md) and supported provider settings.
- **Evidence verification fails.** Preserve the original run and outputs. Diagnose the error, prepare a fresh snapshot and rerun with a new key. [Recovery runbook](../engineering/RUNBOOKS.md)

## Tested toolchain

| Tool                               | Exact tested version                          |
| ---------------------------------- | --------------------------------------------- |
| Node / npm                         | 24.16.0 / 11.9.0                              |
| TypeScript / tsx                   | 7.0.2 / 4.23.15                               |
| Vitest                             | 5.1.0                                         |
| Playwright / Chromium headless     | 1.65.0 / 158.0.8127.18, revision 1254         |
| axe / oasdiff                      | 4.14.0 / 1.35.0                               |
| better-sqlite3 / csv-parse         | 13.0.3 / 7.0.3                                |
| Switch Console / Core / Mattermost | Recorded integration 0.40.1 / 0.31.0 / 11.9.0 |

Other operating systems and browser distributions have no verified support in this release.

[Documentation index](../README.md) · [Testing and evidence](../testing/TESTING.md) · [Human review procedure](../human-review/PROCEDURE.md)
