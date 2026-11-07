# Switch and Mattermost setup

The synthetic demonstration completed through a real human, Switch, Mattermost and Codex. The reviewed defective run produced four FAIL results with valid evidence and a BLOCKED assessment. After a separate human patch review, the corrected run produced four PASS results with valid evidence, READY_FOR_HUMAN_APPROVAL and zero blockers. A third human review then recorded a Level 1 HUMAN_ATTESTED_FOR_DEMO decision. The decision was effective at completion. A later read reported EXPIRED while retaining the recorded decision. Level 1 records manual demo attestation and provides no production deployment authority.

1. Install Switch and configure a Mattermost connection using the supported Switch Console controls.
2. Add a dedicated Codex agent. Set its directory to the repository root. Give the agent a distinct local name. Bridge a Switch room to a Mattermost channel with that agent and the human reviewer.
3. Add the [runner instructions](switchforge-runner.md). Keep provider permission protections enabled. Scope executable permissions to your verified Node and npm installation and the documented read-only and run commands.
4. Send a human message in the room requesting a CLI doctor check. Compare its output with the runner environment and resolve any real dependency issue before preparing a snapshot.
5. Follow the [three human reviews](../human-review/PROCEDURE.md). Have the agent report the actual four engine results, coverage and ReleaseProof decision in the same room. Verify both runs and use the compare command after the corrected run.

The room supplies agent routing, shared conversation and the human handoffs. The CLI executes the deterministic checks and validates evidence independently. Use the actual returned IDs in your own room and keep any private room receipts out of public artifacts.

Official references: [onboard agents](https://docs.switchagents.ai/switch-rooms/getting-started/onboard-your-agents), [create a room](https://docs.switchagents.ai/switch-rooms/getting-started/create-a-room), and [working safely](https://docs.switchagents.ai/switch-rooms/resources/working-safely-with-agents).
