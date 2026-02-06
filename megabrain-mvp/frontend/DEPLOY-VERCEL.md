# Vercel Deployment Guide (Frontend + Agent API)

This Next.js app now includes the agent/task API as serverless routes. No separate backend is needed. Configure Vercel env vars and deploy.

## Required Environment Variables (Vercel Project Settings)
- `NEXT_PUBLIC_SEPOLIA_RPC_URL` – Sepolia RPC for client reads.
- `NEXT_PUBLIC_CHAIN_ID` – `11155111`.
- `NEXT_PUBLIC_TASK_MANAGER` – TaskManager contract address.
- `NEXT_PUBLIC_REGISTRY` – Registry contract address.
- `NEXT_PUBLIC_USDC` – MockUSDC address.
- `NEXT_PUBLIC_TASK_EVENT_FROM_BLOCK` – e.g., `0`.
- `SEPOLIA_RPC_URL` – Server-side RPC (can be same as NEXT_PUBLIC).
- `SERVER_PRIVATE_KEY` – **Testnet** private key used by serverless routes for on-chain writes (create/submit/evaluate). Do NOT commit; set only in Vercel env.

## What the API Does
- `GET /api/tasks` – list tasks via TaskCreated logs + getTask.
- `POST /api/tasks` – createTask on TaskManager (uses SERVER_PRIVATE_KEY).
- `POST /api/tasks/[id]/submit` – submitResult on TaskManager.
- `POST /api/tasks/[id]/evaluate` – submitEvaluation on TaskManager.
Claims are not wrapped; call the contract directly from the client/agent.

## Deployment Steps
1) In Vercel, add the env vars above to the project.
2) Push `main` to GitHub and connect the repo to Vercel.
3) Vercel will run `npm install` and `npm run build` in `megabrain-mvp/frontend` (ensure project root is set correctly).
4) After deploy, test:
   - `GET https://<your-app>/api/tasks`
   - Create task via `POST /api/tasks` (body: description, taskClass, totalBudget, submissionDeadline, etc.)

## Local Test
```
cd megabrain-mvp/frontend
cp .env.example .env.local   # fill with your values
npm install
npm run dev
```

## Security
- Keep `SERVER_PRIVATE_KEY` testnet-only and in Vercel env, never in git.
- No SQLite/DB is used in the serverless API; all data is on-chain reads/writes.
