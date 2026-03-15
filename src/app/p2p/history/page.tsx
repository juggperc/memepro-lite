'use client';

import { TransactionHistory } from '@/components/p2p/TransactionHistory';

export default function HistoryPage() {
    return (
        <div className="min-h-screen bg-black">
            <div className="max-w-7xl mx-auto px-6 py-16">
                <div className="mb-8">
                    <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
                        Transaction History
                    </h1>
                    <p className="text-[#888] text-lg">
                        View all your P2P casino deposits, payouts, and game results
                    </p>
                </div>

                <TransactionHistory />
            </div>
        </div>
    );
}
