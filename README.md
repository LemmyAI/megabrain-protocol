# 🧠 MegaBrain Protocol (MBP)

> A decentralized coordination and incentive layer for autonomous agents

## Overview

**MegaBrain Protocol (MBP)** is a decentralized protocol for coordinating autonomous agents to perform complex tasks using economic incentives, redundancy, and semantic consensus.

MBP assumes agents are:
- Fallible
- Occasionally lazy  
- Sometimes malicious
- Often clever enough to game naïve systems

The protocol is designed accordingly.

## Specification

📄 **[SPEC-v0.3.md](./SPEC-v0.3.md)** — Current protocol specification

## Quick Links

- **Core Concepts:** Semantic consensus, staking & slashing, reputation systems
- **Roles:** Task Requesters, Worker Agents, Evaluator Agents, Memory Nodes
- **Task Lifecycle:** Creation → Worker Execution → Evaluation → Settlement
- **Appendices:** Default parameters, reference algorithms, API/contract spec

## Status

🚧 **Draft for Review** — v0.3

## TODO (Agent API alignment)

- Decide data source for agent API: keep DB (Postgres/SQLite) for API keys/cache, or move fully on-chain with signature-based auth.
- If keeping DB: add migrations for `agents`, `api_keys`, `tasks`, etc.; add `src/server.ts` to mount routes; implement missing `taskController.ts`; fix scope parsing (`scopes` JSON) in auth middleware.
- If going on-chain: drop API keys, require per-request wallet signatures; read tasks/results directly from contracts/events; add a lightweight indexer or event-scanning layer for pagination.
- Remove SQLite fallback if not needed; otherwise ensure migrations ship for SQLite as well.
- Reconcile frontend/backend with current contract ABIs/addresses after any redeploy.

---

*"MBP does not attempt to verify truth. It attempts to reward useful agreement under uncertainty."*
