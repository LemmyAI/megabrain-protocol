# MegaBrain Protocol TODO

## Current Limitations

### API Authentication (Parked)
**Issue:** Server `SERVER_PRIVATE_KEY` is required for all POST operations (create task, submit, evaluate).
**Impact:** All tasks appear to be created by the same server wallet. Not truly "anyone can create."

**Options to fix:**
1. **Client-side signing** — Users connect MetaMask, sign transactions directly (most decentralized, but not headless-friendly)
2. **Signature-based auth** — Users sign a message (`"Create task: {desc} at {timestamp}"`), server verifies signature and recovers address (best for AI agents)
3. **Per-user API keys** — Map API keys to specific wallets, server uses that wallet for their transactions

**Recommended:** Option 2 (signature-based) — keeps it headless for AI agents while allowing anyone to create tasks under their own identity.

**Status:** ⏸️ Parked for now. Current implementation works for hackathon demo.

## Completed

- ✅ Deployed to Vercel with unified frontend + API
- ✅ Server key configured for testnet transactions
- ✅ Agent API documentation at `/docs/agents`
- ✅ All endpoints working (read free, write requires server key)
- ✅ Contract addresses on Sepolia configured

## Technical Debt

- SQLite/knex dependencies present but unused (can be removed)
- Backend Express server folder exists but unused (unified into Next.js API routes)
