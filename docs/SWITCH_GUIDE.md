# Real Switch collaboration guide

Status on November 6, 2026: Docker was started through its supported CLI; existing Switch Core and Mattermost answer health checks. Dedicated Codex agent `switchforge-demo-agent` is Running, with the original repository as Directory. Room `switchforge-release-demo` is bridged to Mattermost and includes the agent and linked human account. Normal Auto mode is on, Bypass permissions is off and agent-management permission is off. The real human command request and full workflow are **not verified**. Only the automatically emitted bot welcome was observed; it is not command proof.

Preserve existing connectivity agent and existing connectivity agent with their connectivity-only instructions. Do not reset the existing server, database or Mattermost data.

Using supported Switch Console controls, create one dedicated Codex agent named switchforge-demo-agent (the verified local name). Select this existing repository as Directory and keep normal provider permission protections. Create switchforge-release-demo bridged to the existing Mattermost connection, with the actual human and dedicated agent. Link the actual human chat identity if needed. Do not enable permission bypass as a shortcut.

Attach [runner instructions](agents/switchforge-runner.md). Use Console-managed agent transport; no custom webhook or protocol client is required. Current official protocol is WebSocket events plus HTTP actions; older SSE marketing text is not implementation authority.

## G0 proof

A **real human** sends an addressed message asking the runner to read package.json and run node --version in the configured repository, without edits. Capture exact agent identity, working directory, command, stdout, exit status and same-room reply. Do not use the earlier SETUP_OK exchange as proof of command execution.

## Full workflow

After genuine criteria/test review, the human requests verification of a prepared defective snapshot. Agent runs the actual sf command and posts run ID, candidate digest, statuses and evidence paths. Human asks about a finding; agent cites its raw report and proposes a minimal diff. The human actually reviews/authorizes the staged change through the provider flow. Prepare corrected snapshot; rerun all four engines. Final readiness is taken only from ReleaseProof. Human separately records the supported attestation; the agent reports its exact state without claiming deployment or strong identity.

Capture both runs, actual review/denial, real reports and tool versions. Keep credentials and unnecessary user/local-path details out of the recording. This guide is a procedure, not proof these steps happened.

Official references: [onboard agents](https://docs.switchagents.ai/switch-rooms/getting-started/onboard-your-agents), [create a room](https://docs.switchagents.ai/switch-rooms/getting-started/create-a-room), [working safely](https://docs.switchagents.ai/switch-rooms/resources/working-safely-with-agents), [agent protocol](https://docs.switchagents.ai/switch-rooms/internals/agent-protocol).

The configured room is open locally in Mattermost (private local reference). See [human actions](../ACTION_REQUIRED_FROM_HUMAN.md) for exact messages and distinct criteria/patch/release commands. Current service ports are observed, not fixed guarantees; verify health after restart. Provider execution/model access remains unproved until a real human request produces an actual CLI receipt.
