# Historical environment baseline — November 6, 2026

> This snapshot preserves the earlier provider and review state. The room execution and human reviews were subsequently completed; see the [current demo](../hackathon/DEMO.md) and [reproduction steps](README.md).

Development verification: November 6, 2026, Windows x64. Exact supported local runtime is Node 24.16.0 and selected npm 11.9.0. The bundled Node npm package differs (11.13.0); inventory follows the npm wrapper's actual selected installation.

| Component                             | Actual local observation                                                                               |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Node/npm/Git                          | v24.16.0 / 11.9.0 / 2.54.0.windows.1                                                                   |
| TypeScript/tsx/Vitest                 | 7.0.2 / 4.23.15 / 5.1.0                                                                                |
| Playwright / axe                      | 1.65.0 / 4.14.0                                                                                        |
| Chromium                              | Headless shell 158.0.8127.18, revision 1254; actual launch verified                                    |
| Chromium executable SHA-256           | 673a4ca752515970be319edf7997b03cc7a6f48c160eea5eb8d6d9048be2f755                                       |
| better-sqlite3 / SQLite               | 13.0.3 / 3.53.4; real transaction and FK/restart tests passed                                          |
| oasdiff                               | 1.35.0; official archive and executable hashes in config/toolchain-expected.json                       |
| Current Docker daemon                 | RUNNING: Docker Engine 29.9.2; supported desktop start, no reset                                       |
| Current Switch/Mattermost HTTP probes | Core 127.0.0.1:58821/health status ok; Mattermost 127.0.0.1:58822/api/v4/system/ping status OK         |
| Earlier recorded collaboration setup  | Console 0.40.1, Core 0.31.0, Mattermost 11.9.0 and Codex 0.166.0; historical Phase 1 connectivity only |
| Dedicated project command proof       | Agent/room created and Running; genuine human command proof NOT VERIFIED                               |
| Human criteria/test review            | PENDING; explicitly withheld by user                                                                   |

Fresh npm ci succeeded with zero reported vulnerabilities. Full local automated suite and review-packet execution reports are private under .local/verification. No independent fresh-machine clone, actual CI run or live project Switch workflow is claimed.

The full-browser launcher returned spawn UNKNOWN. The supported matching headless-shell already installed by Playwright launches correctly and is the executable now hashed and invoked. The cause of the full-browser launcher failure is unestablished; no security settings were changed.
