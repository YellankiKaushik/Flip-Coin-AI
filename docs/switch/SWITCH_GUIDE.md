# Connect SwitchForge to Mattermost

Use a clean Windows x64 checkout that has passed the [local doctor check](../getting-started/README.md). One human uses Mattermost and one configured Codex agent does the verification work. Switch connects them. The four engineering checks run inside the CLI as deterministic tools.

## 1. Start Switch and Mattermost

1. Install the Windows x64 build of Switch Console from the official instructions and open it. On first run, choose **Get started** and the supported local server option, or sign in to the existing server you intend to use. The Windows build is early access. [Console installation](https://docs.switchagents.ai/switch-rooms/getting-started/install-switch-console) · [Server choices](https://docs.switchagents.ai/switch-rooms/getting-started/add-a-server)
2. For the bundled Mattermost workflow used in the demo, start Docker Desktop and confirm `docker info` can reach the engine before opening Console. Console can run a local Switch server without Docker, while the demo's bundled Mattermost needs Docker. If Docker was just installed and Console cannot discover it, reopen Console after Docker is healthy and use its supported server status controls. Preserve the existing server and room data.
3. Open the server's **Home** and check **Messaging apps**. For the bundled Mattermost connection, use **Sign-in details…** to sign in privately and confirm you can open its team. An administrator connecting a different Mattermost server should follow the official setup and account-linking instructions. Keep passwords and tokens out of the project and room. [Mattermost connection](https://docs.switchagents.ai/switch-rooms/deploy/messaging-apps/mattermost)

These control labels come from the current official Console guides. The recorded integration used Console 0.40.1, Core 0.31.0 and Mattermost 11.9.0. Labels and available controls can differ by Console version, server and admin role.

## 2. Register the Codex agent and create a room

1. In **Your Agents**, add an agent. Set its **Run location** to the Windows host containing the clean checkout and choose **Codex** as **Agent provider**. Confirm Codex is installed and signed in on that host. Set **Directory** to the repository root containing `package.json`, `config/` and `fixtures/`. Give the agent a local name and add the [SwitchForge runner instructions](switchforge-runner.md). [Agent setup](https://docs.switchagents.ai/switch-rooms/getting-started/onboard-your-agents)
2. Keep **Bypass permissions** off. In **Auto mode**, the provider still decides which actions can run automatically and which require approval. Constrain actual provider approvals to the verified npm CLI entry point and these SwitchForge subcommands: `doctor`, `prepare`, `run`, `verify-evidence`, `report`, `compare` and read-only `criteria inspect`. If an allowed npm wrapper cannot launch, use an operator-verified Node/npm entry point only when the exact invocation is separately authorized. Keep arbitrary Node execution and interactive attestations outside the agent's scope. Agent instructions describe the boundary. Provider settings and human approvals enforce it. [Agent settings](https://docs.switchagents.ai/switch-rooms/getting-started/agent-settings)
3. In **Your Rooms**, select **Create room**, choose the **Mattermost** messaging app connection and add the Codex agent. Open the corresponding Mattermost channel and confirm the human and agent are members. For an existing Mattermost channel, use the official existing-channel procedure, then confirm the room appears under **Your Rooms** and use **Add to room** for the agent if needed. [Create or connect a room](https://docs.switchagents.ai/switch-rooms/getting-started/create-a-room)

## 3. Verify the handoff in the real conversation

From Mattermost, replace the placeholder with the registered mention or room alias and send:

```text
@YOUR_AGENT Run the allowed SwitchForge doctor --json from the configured repository root. Reply in this thread with the actual exit code and JSON. Stop after doctor.
```

Check the same-thread reply for a real CLI invocation, exit zero and `ok: true`. If the agent is silent, check human account linkage, room membership, the exact mention, and provider readiness. If it receives the message and the command fails, inspect its working directory, executable resolution and approval request. Resolve the exact launch or dependency error and repeat doctor.

For a safe follow-up, ask the agent to prepare a defective diagnostic snapshot, run the four checks, verify the resulting evidence and reply with the returned run ID, engine statuses and ReleaseProof assessment. The acceptance check reports `ERROR` without reviewed criteria and ReleaseProof reports `BLOCKED`. Keep the response in the same Mattermost thread. To reproduce the reviewed workflow, the human performs the three interactive decisions described in the [review procedure](../human-review/PROCEDURE.md). The agent verifies the recorded criteria and exact patch bindings and reports the results. Keep private IDs, local paths and receipts out of public evidence.

[Request-to-evidence architecture](../architecture/ARCHITECTURE.md) · [Actual demo and evidence](../hackathon/DEMO.md) · [Recovery runbook](../engineering/RUNBOOKS.md)
