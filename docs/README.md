# Start with SwitchForge

SwitchForge runs four engineering checks for a frozen synthetic checkout and brings the evidence back to the team through Switch. [Project overview](../README.md) · [Watch the demonstration](hackathon/DEMO.md)

| If you want to…                        | Start here                                                                                                                                                       |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Judge the completed workflow           | [Hackathon and problem overview](hackathon/PROJECT_OVERVIEW.md), [demo and evidence](hackathon/DEMO.md), [scope and entry checklist](hackathon/CHECKLIST.md)     |
| Reproduce on Windows x64               | [Setup and reproduction](getting-started/README.md), [pinned environment](getting-started/ENVIRONMENT_BASELINE.md), [CLI reference](getting-started/CLI.md)      |
| Connect the agent to the team          | [Switch and Mattermost setup](switch/SWITCH_GUIDE.md), [runner command boundaries](switch/switchforge-runner.md)                                                 |
| Inspect source and evidence boundaries | [Project map](PROJECT_MAP.md), [architecture](architecture/ARCHITECTURE.md), [design decisions](architecture/DECISIONS.md), [tests and CI](testing/TESTING.md)   |
| Understand the three human decisions   | [Review procedure](human-review/PROCEDURE.md), [original criteria/test packet](../HUMAN_REVIEW_PACKET.md), [reviewed patch](human-review/PATCH_REVIEW_PACKET.md) |
| Troubleshoot a local run               | [Recovery runbook](engineering/RUNBOOKS.md)                                                                                                                      |
| Verify media or licenses               | [Asset provenance](assets/README.md), [dependency manifest](dependencies.lock.json), [license notices](licenses/README.md)                                       |
| Read earlier checkpoints               | [Engineering history](history/README.md)                                                                                                                         |

**Current verified demo:** four genuine failures blocked the defective run. After a separate human patch review, four genuine passes and valid evidence yielded `READY_FOR_HUMAN_APPROVAL`. The final Level 1 decision was recorded as `HUMAN_ATTESTED_FOR_DEMO`; the latest effective state is `EXPIRED`. Historical checkpoint language does not describe a current approval.
