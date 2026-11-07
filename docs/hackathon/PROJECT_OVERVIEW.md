# Flip the Switch Hackathon 2026

The November 4–7 event was co-hosted by WeMakeDevs and DevTools Academy and powered by Switch AI. The challenge asks teams to connect a coding agent to a shared chat through Switch and use it to complete real work together. SwitchForge is an independent synthetic prototype for the **Best Business Workflow** track. [Official event](https://www.wemakedevs.org/hackathons/switch) · [Schedule](https://www.wemakedevs.org/hackathons/switch/schedule) · [Rules](https://www.wemakedevs.org/hackathons/switch/rules) · [Co-host guide](https://www.devtoolsacademy.com/hackathons/flip-the-switch)

## The release-review problem

A chat summary alone leaves a reviewer guessing which candidate was checked, whether the requirements and tests were reviewed, and whether all mandatory checks ran. A usable review also needs verifiable evidence, the exact reviewed correction, and a separate human decision on readiness.

## What SwitchForge implements

Switch routes a human request from Mattermost to Codex. The CLI freezes the synthetic checkout candidate and records results from four deterministic engines. ReleaseProof evaluates the evidence and readiness. Codex reports back to the same room. Three separate human reviews bind the criteria and tests, the exact correction, and the final readiness decision. [Project map](../PROJECT_MAP.md) · [Demo evidence](DEMO.md)

| Check            | Defective run                           | Corrected run                             |
| ---------------- | --------------------------------------- | ----------------------------------------- |
| AcceptanceRelay  | FAIL — coupon accepted at exact expiry  | PASS — coupon rejected at exact expiry    |
| A11yRelay        | FAIL — email label absent               | PASS — explicit label present             |
| ContractGuardian | FAIL — documented JSON response removed | PASS — JSON response restored             |
| DataRescue       | FAIL — synthetic 500-cent difference    | PASS — synthetic order and ledger agree   |
| ReleaseProof     | `BLOCKED`                               | `READY_FOR_HUMAN_APPROVAL`, zero blockers |

Both runs have valid evidence. The final Level 1 decision remains recorded as `HUMAN_ATTESTED_FOR_DEMO`. Its current effective state is `EXPIRED`. Level 1 records manual attestation. The demo uses local evidence and a synthetic checkout. Accessibility coverage is limited to the configured label rule, API coverage to OpenAPI documents, and data coverage to the synthetic CSV reconciliation. [Review procedure](../human-review/PROCEDURE.md) · [Engineering limits](../architecture/ARCHITECTURE.md)

[Public README](../../README.md) · [V2 demo](https://github.com/YellankiKaushik/Flip-Coin-AI/releases/download/switchforge-demo-2026-v2/SwitchForge-2026-editorial-v2.mp4) · [Original v1 demo](https://github.com/YellankiKaushik/Flip-Coin-AI/releases/download/switchforge-demo-2026-11-07/SwitchForge-2026-demo.mp4) · [CI for the verified v2 delivery](https://github.com/YellankiKaushik/Flip-Coin-AI/actions/runs/42356934740) · [Current main CI](https://github.com/YellankiKaushik/Flip-Coin-AI/actions/workflows/ci.yml?query=branch%3Amain)
