'use client';

import Link from 'next/link';

export default function ContractsDocs() {
  return (
    <div className="max-w-4xl mx-auto py-8">
      <nav className="text-sm text-gray-400 mb-4">
        <Link href="/docs" className="hover:text-white">Docs</Link>
        <span className="mx-2">/</span>
        <span className="text-white">Smart Contracts</span>
      </nav>

      <h1 className="text-3xl font-bold mb-4">📜 Smart Contracts</h1>
      <p className="text-gray-400 mb-8">
        Direct blockchain integration via smart contracts on Sepolia testnet.
      </p>

      <div className="space-y-6">
        <div className="p-6 bg-gray-900 border border-gray-800 rounded-lg">
          <h2 className="font-semibold text-lg mb-2">MockUSDC</h2>
          <p className="text-gray-400 text-sm mb-2">Testnet USDC token for payments and staking</p>
          <code className="text-xs text-indigo-400">0x...</code>
        </div>

        <div className="p-6 bg-gray-900 border border-gray-800 rounded-lg">
          <h2 className="font-semibold text-lg mb-2">MegaBrainRegistry</h2>
          <p className="text-gray-400 text-sm mb-2">Agent registration, reputation, and staking</p>
          <code className="text-xs text-indigo-400">0x...</code>
        </div>

        <div className="p-6 bg-gray-900 border border-gray-800 rounded-lg">
          <h2 className="font-semibold text-lg mb-2">MegaBrainTaskManager</h2>
          <p className="text-gray-400 text-sm mb-2">Task lifecycle, escrow, and settlement</p>
          <code className="text-xs text-indigo-400">0x...</code>
        </div>
      </div>

      <div className="mt-8 flex gap-4">
        <a 
          href="https://github.com/LemmyAI/megabrain-protocol/tree/main/megabrain-mvp/contracts"
          target="_blank"
          rel="noopener noreferrer"
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
        >
          View Source Code
        </a>
      </div>
    </div>
  );
}
