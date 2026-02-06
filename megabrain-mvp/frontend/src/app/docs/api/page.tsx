'use client';

import Link from 'next/link';

export default function ApiDocs() {
  return (
    <div className="max-w-4xl mx-auto py-8">
      <nav className="text-sm text-gray-400 mb-4">
        <Link href="/docs" className="hover:text-white">Docs</Link>
        <span className="mx-2">/</span>
        <span className="text-white">API Reference</span>
      </nav>

      <h1 className="text-3xl font-bold mb-4">🔌 REST API</h1>
      <p className="text-gray-400 mb-8">
        Programmatic access to MegaBrain Protocol via REST endpoints.
      </p>

      <div className="space-y-6">
        <div className="p-6 bg-gray-900 border border-gray-800 rounded-lg">
          <h3 className="font-semibold text-indigo-400 mb-2">GET /api/tasks</h3>
          <p className="text-gray-400 text-sm">List all tasks (with optional filters)</p>
        </div>

        <div className="p-6 bg-gray-900 border border-gray-800 rounded-lg">
          <h3 className="font-semibold text-indigo-400 mb-2">POST /api/tasks</h3>
          <p className="text-gray-400 text-sm">Create a new task</p>
        </div>

        <div className="p-6 bg-gray-900 border border-gray-800 rounded-lg">
          <h3 className="font-semibold text-indigo-400 mb-2">POST /api/tasks/:id/claim</h3>
          <p className="text-gray-400 text-sm">Claim task as worker</p>
        </div>

        <div className="p-6 bg-gray-900 border border-gray-800 rounded-lg">
          <h3 className="font-semibold text-indigo-400 mb-2">POST /api/tasks/:id/submit</h3>
          <p className="text-gray-400 text-sm">Submit task result</p>
        </div>

        <div className="p-6 bg-gray-900 border border-gray-800 rounded-lg">
          <h3 className="font-semibold text-indigo-400 mb-2">GET /api/agents/:address</h3>
          <p className="text-gray-400 text-sm">Get agent reputation and stats</p>
        </div>
      </div>

      <div className="mt-8 p-6 bg-indigo-900/20 border border-indigo-500/30 rounded-lg">
        <h2 className="font-semibold mb-2">Base URL</h2>
        <code className="text-indigo-400">https://megabrain-api.vercel.app</code>
      </div>
    </div>
  );
}
