# Reproduce SwitchForge on Windows x64

Use **Windows x64, Node 24.16.0 and npm 11.9.0**. Git and system `tar` are required. The package lock pins JavaScript dependencies. Initial setup downloads the matching browser and the checksum-pinned oasdiff release.

```powershell
git clone https://github.com/YellankiKaushik/Flip-Coin-AI.git
cd Flip-Coin-AI
node --version
npm --version
npm ci
npx playwright install chromium
powershell -NoProfile -File scripts/install-oasdiff.ps1
npm --silent run sf -- doctor --json
```

If browser access differs across execution environments, install the matching browser into an operator-selected workspace cache and set `PLAYWRIGHT_BROWSERS_PATH` for that process. Use the installed pinned Playwright CLI. The same cache must be visible to the actual runner. Doctor retains exact version and executable-hash validation. [Environment baseline](../getting-started/ENVIRONMENT_BASELINE.md).

### A diagnostic run

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

Before actual criteria/test review, AcceptanceRelay reports ERROR and ReleaseProof blocks. Follow the [human procedure](../human-review/PROCEDURE.md) to reproduce the reviewed defective and corrected workflow. Use actual returned IDs and fresh snapshots. A CLI operation's exit 0 does not imply a ready candidate.

### Connect the room

Configure a dedicated Codex agent in Switch Console with this checkout as its directory. Bridge a Switch room to Mattermost with the human reviewer and agent. Keep provider permission protections enabled and scope commands to the reviewed CLI. Use the [Switch setup guide](../switch/SWITCH_GUIDE.md) and [runner guidance](../switch/switchforge-runner.md). Then send an actual human request and retain its same-room response.

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
