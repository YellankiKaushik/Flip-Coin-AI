# Real Switch collaboration guide

Status: prior setup connectivity was recorded; dedicated SwitchForge command execution and full live workflow are **not verified**. Desktop automation twice returned the Escape-stop response. No human room message or approval was simulated.

Preserve existing connectivity agent and existing connectivity agent with their connectivity-only instructions. Do not reset the existing server, database or Mattermost data.

Using supported Switch Console controls, create one dedicated Codex agent named switchforge-runner (or a documented unique equivalent). Select this existing repository as Directory and keep normal provider permission protections. Create checkout-release-room bridged to the existing Mattermost connection, with the actual human and dedicated agent. Link the actual human chat identity if needed. Do not enable permission bypass as a shortcut.

Attach [runner instructions](agents/switchforge-runner.md). Use Console-managed agent transport; no custom webhook or protocol client is required. Current official protocol is WebSocket events plus HTTP actions; older SSE marketing text is not implementation authority.

## G0 proof

A **real human** sends an addressed message asking the runner to read package.json and run node --version in the configured repository, without edits. Capture exact agent identity, working directory, command, stdout, exit status and same-room reply. Do not use the earlier SETUP_OK exchange as proof of command execution.

## Full workflow

After genuine criteria/test review, the human requests verification of a prepared defective snapshot. Agent runs the actual sf command and posts run ID, candidate digest, statuses and evidence paths. Human asks about a finding; agent cites its raw report and proposes a minimal diff. The human actually reviews/authorizes the staged change through the provider flow. Prepare corrected snapshot; rerun all four engines. Final readiness is taken only from ReleaseProof. Human separately records the supported attestation; the agent reports its exact state without claiming deployment or strong identity.

Capture both runs, actual review/denial, real reports and tool versions. Keep credentials and unnecessary user/local-path details out of the recording. This guide is a procedure, not proof these steps happened.

Official references: [onboard agents](https://docs.switchagents.ai/switch-rooms/getting-started/onboard-your-agents), [create a room](https://docs.switchagents.ai/switch-rooms/getting-started/create-a-room), [working safely](https://docs.switchagents.ai/switch-rooms/resources/working-safely-with-agents), [agent protocol](https://docs.switchagents.ai/switch-rooms/internals/agent-protocol).
