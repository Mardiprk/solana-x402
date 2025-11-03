'use client';

import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { InitializeConfig } from '../components/InitializeConfig';
import { CreatePaymentRequest } from '../components/CreatePaymentRequest';
import { VerifyPayment } from '../components/VerifyPayment';
import { CheckPaymentStatus } from '../components/CheckPaymentStatus';
import { CancelPaymentRequest } from '../components/CancelPaymentRequest';
import { CloseConfigAccount } from '../components/CloseConfigAccount';
import { useState, useEffect } from 'react';

export default function Home() {
  const [activeTab, setActiveTab] = useState<string>('create');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const tabs = [
    { id: 'create', label: 'Create Request' },
    { id: 'verify', label: 'Verify Payment' },
    { id: 'status', label: 'Check Status' },
    { id: 'cancel', label: 'Cancel Request' },
    { id: 'config', label: 'Config' },
    { id: 'debug', label: 'Debug' },
  ];

  if (!mounted) {
    return null;
  }

  return (
    <main className="min-h-screen bg-white text-gray-900 antialiased">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-50">
        <div className="container mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Solana Payments</h1>
              <p className="text-sm text-gray-500 mt-1">Decentralized payment system</p>
            </div>
            <WalletMultiButton className="!bg-gray-900 !text-white hover:!bg-gray-800 !rounded-md !font-medium !px-4 !py-2" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-12 max-w-5xl">
        {/* Tab Navigation */}
        <div className="mb-10 border-b border-gray-200">
          <div className="flex overflow-x-auto -mb-px">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 text-sm font-medium transition-colors whitespace-nowrap border-b-2 ${
                  activeTab === tab.id
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-8">
          {activeTab === 'create' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-semibold mb-2 text-gray-900">Create Payment Request</h2>
                <p className="text-sm text-gray-600">Generate a new payment request for your services</p>
              </div>
              <CreatePaymentRequest />
            </div>
          )}

          {activeTab === 'verify' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-semibold mb-2 text-gray-900">Verify Payment</h2>
                <p className="text-sm text-gray-600">Process and verify a payment request</p>
              </div>
              <VerifyPayment />
            </div>
          )}

          {activeTab === 'status' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-semibold mb-2 text-gray-900">Check Payment Status</h2>
                <p className="text-sm text-gray-600">View the status of any payment request</p>
              </div>
              <CheckPaymentStatus />
            </div>
          )}

          {activeTab === 'cancel' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-semibold mb-2 text-gray-900">Cancel Request</h2>
                <p className="text-sm text-gray-600">Cancel an unpaid payment request</p>
              </div>
              <CancelPaymentRequest />
            </div>
          )}

          {activeTab === 'config' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-semibold mb-2 text-gray-900">Configuration</h2>
                <p className="text-sm text-gray-600">Initialize system configuration (one-time setup)</p>
              </div>
              <InitializeConfig />
            </div>
          )}

          {activeTab === 'debug' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-semibold mb-2 text-gray-900">Debug</h2>
                <p className="text-sm text-gray-600">Debug tools for config account management</p>
              </div>
              <CloseConfigAccount />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-20 pt-8 border-t border-gray-200">
          <div className="text-center text-xs text-gray-500">
            <p className="mb-2">Built on Solana • Powered by Anchor</p>
            <p className="font-mono text-gray-400">Program ID: 2HkEaAhDkTbN9wpVyky8Gmh79xUxRRRiwrqkc8tTUArQ</p>
          </div>
        </div>
      </div>
    </main>
  );
}
