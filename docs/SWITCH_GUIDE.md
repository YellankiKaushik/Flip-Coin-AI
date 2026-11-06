# Real Switch collaboration guide

Status on November 6, 2026: Docker was started through its supported CLI; existing Switch Core and Mattermost answer health checks. Dedicated Codex agent `switchforge-demo-agent` is Running, with the original repository as Directory. Room `switchforge-release-demo` is bridged to Mattermost and includes the agent and linked human account. Normal Auto mode is on, Bypass permissions is off and agent-management permission is off. The real human request at 19:31 IST and agent response at 19:33 are **verified**. The requested npm doctor command exited 1 before SwitchForge started, MODULE_NOT_FOUND for npm-cli.js, and produced no project JSON/run/artifacts. Successful project CLI execution and the full reviewed workflow remain unverified.

Preserve existing connectivity agent and existing connectivity agent with their connectivity-only instructions. Do not reset the existing server, database or Mattermost data.

The local agent and room below already exist; do not duplicate them. For a separate fresh-machine setup using supported Switch Console controls, create one dedicated Codex agent named switchforge-demo-agent (the verified local name). Select this existing repository as Directory and keep normal provider permission protections. Create switchforge-release-demo bridged to the existing Mattermost connection, with the actual human and dedicated agent. Link the actual human chat identity if needed. Do not enable permission bypass as a shortcut.

Attach [runner instructions](agents/switchforge-runner.md). Use Console-managed agent transport; no custom webhook or protocol client is required. Current official protocol is WebSocket events plus HTTP actions; older SSE marketing text is not implementation authority.

## G0 proof

A **real human** sends an addressed message asking the runner to read package.json and run node --version in the configured repository, without edits. Capture exact agent identity, working directory, command, stdout, exit status and same-room reply. Do not use the earlier SETUP_OK exchange as proof of command execution.

## Full workflow

After genuine criteria/test review, the human requests verification of a prepared defective snapshot. Agent runs the actual sf command and posts run ID, candidate digest, statuses and evidence paths. Human asks about a finding; agent cites its raw report and proposes a minimal diff. The human actually reviews/authorizes the staged change through the provider flow. Prepare corrected snapshot; rerun all four engines. Final readiness is taken only from ReleaseProof. Human separately records the supported attestation; the agent reports its exact state without claiming deployment or strong identity.

Capture both runs, actual review/denial, real reports and tool versions. Keep credentials and unnecessary user/local-path details out of the recording. This guide is a procedure, not proof these steps happened.

Official references: [onboard agents](https://docs.switchagents.ai/switch-rooms/getting-started/onboard-your-agents), [create a room](https://docs.switchagents.ai/switch-rooms/getting-started/create-a-room), [working safely](https://docs.switchagents.ai/switch-rooms/resources/working-safely-with-agents), [agent protocol](https://docs.switchagents.ai/switch-rooms/internals/agent-protocol).

The configured room is open locally in Mattermost (private local reference). See [human actions](../ACTION_REQUIRED_FROM_HUMAN.md) for exact messages and distinct criteria/patch/release commands. Current service ports are observed, not fixed guarantees; verify health after restart. The provider processed the genuine request and posted its actual failure; successful project CLI execution remains unproved. A human must send the retry in ACTION_REQUIRED_FROM_HUMAN.md. Preserve the initial npm failure and record any npm.cmd/direct-node retry separately.

## Observed real interaction

The actual human request (private local reference) and agent failure reply (private local reference) are local Mattermost links. The actual configured working directory is the original repository. No snapshot/run/artifact identity was emitted because npm failed before the CLI. Exact npm, npm.cmd and direct Node probes succeed locally, so provider-context root cause remains UNSPECIFIED. No permission bypass or global launcher edit was used. Full command proof still needs a genuine human-requested retry; no assistant-authored human message is evidence.
