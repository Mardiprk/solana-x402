'use client';

import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { InitializeConfig } from '../components/InitializeConfig';
import { CreatePaymentRequest } from '../components/CreatePaymentRequest';
import { VerifyPayment } from '../components/VerifyPayment';
import { CheckPaymentStatus } from '../components/CheckPaymentStatus';
import { CancelPaymentRequest } from '../components/CancelPaymentRequest';
import { useState, useEffect } from 'react';

export default function Home() {
  const [activeTab, setActiveTab] = useState<string>('create');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const tabs = [
    { id: 'create', label: 'Create Request', icon: '📝' },
    { id: 'verify', label: 'Verify Payment', icon: '✅' },
    { id: 'status', label: 'Check Status', icon: '🔍' },
    { id: 'cancel', label: 'Cancel Request', icon: '❌' },
    { id: 'config', label: 'Initialize Config', icon: '⚙️' },
  ];

  if (!mounted) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="text-3xl">💳</div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Solana Payment System</h1>
                <p className="text-sm text-gray-600">Decentralized payment requests on Solana</p>
              </div>
            </div>
            <WalletMultiButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Info Banner */}
        <div className="bg-blue-600 text-white rounded-lg p-4 mb-6 shadow-lg">
          <div className="flex items-start space-x-3">
            <div className="text-2xl">ℹ️</div>
            <div>
              <h3 className="font-semibold mb-1">Welcome to Solana Payment System</h3>
              <p className="text-sm text-blue-100">
                Create payment requests, verify payments, and manage transactions on the Solana blockchain. 
                Connect your wallet to get started!
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-md mb-6 overflow-hidden">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 min-w-fit px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-indigo-600 text-white border-b-4 border-indigo-800'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border-b-4 border-transparent'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-lg">{tab.icon}</span>
                  <span>{tab.label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="max-w-4xl mx-auto">
          {activeTab === 'create' && (
            <div>
              <CreatePaymentRequest />
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="font-semibold text-lg mb-3">💡 How to Create a Payment Request</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start">
                    <span className="mr-2">1.</span>
                    <span>Enter a unique Request ID (max 64 characters) - this will identify your payment request</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">2.</span>
                    <span>Specify the amount in the smallest token units (e.g., for 5 tokens with 6 decimals, enter 5000000)</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">3.</span>
                    <span>Add a resource identifier (max 128 characters) to describe what the payment is for</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">4.</span>
                    <span>Click "Create Payment Request" to submit the transaction</span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'verify' && (
            <div>
              <VerifyPayment />
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="font-semibold text-lg mb-3">💡 How to Verify a Payment</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start">
                    <span className="mr-2">1.</span>
                    <span>Enter the Request ID of the payment you want to process</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">2.</span>
                    <span>Provide the SPL Token Mint Address (the token you're paying with)</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">3.</span>
                    <span>Enter the Treasury Wallet Address (where the payment will be sent)</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">4.</span>
                    <span>Make sure you have sufficient token balance in your wallet</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">5.</span>
                    <span>Click "Verify & Pay" to process the payment</span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'status' && (
            <div>
              <CheckPaymentStatus />
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="font-semibold text-lg mb-3">💡 Check Payment Status</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Enter any Request ID to view its current status and details</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>You can see if a payment has been completed, who paid it, and when</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>This is useful for tracking payment requests and verifying transactions</span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'cancel' && (
            <div>
              <CancelPaymentRequest />
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="font-semibold text-lg mb-3">💡 Cancel Payment Request</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Only the original requester can cancel a payment request</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>You can only cancel requests that haven't been paid yet</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Cancelling will close the account and return the rent to you</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>This action is permanent and cannot be undone</span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'config' && (
            <div>
              <InitializeConfig />
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="font-semibold text-lg mb-3">💡 Initialize Configuration</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start">
                    <span className="mr-2">⚠️</span>
                    <span className="font-semibold">This should only be done once when first deploying the program!</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">1.</span>
                    <span>Set the treasury wallet address where all payments will be received</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">2.</span>
                    <span>Define the minimum payment amount in smallest token units</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">3.</span>
                    <span>Only the program authority can initialize the config</span>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="mt-12 text-center text-sm text-gray-600">
          <p>Built on Solana • Powered by Anchor Framework</p>
          <p className="mt-2">Program ID: 2HkEaAhDkTbN9wpVyky8Gmh79xUxRRRiwrqkc8tTUArQ</p>
        </div>
      </div>
    </main>
  );
}