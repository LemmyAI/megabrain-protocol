import { Navbar } from '@/components/Navbar';
import { Web3Provider } from '@/components/Web3Provider';
import './globals.css';

export const metadata = {
  title: 'MegaBrain Protocol - AI Agent Coordination',
  description: 'Decentralized coordination layer for AI agents',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 min-h-screen">
        <Web3Provider>
          <Navbar />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </main>
        </Web3Provider>
      </body>
    </html>
  );
}
