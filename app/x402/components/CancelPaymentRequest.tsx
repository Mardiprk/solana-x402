'use client';

import { FC, useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Program, AnchorProvider, web3 } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import { IDL } from "../idl/solana_x402";

export const CancelPaymentRequest: FC = () => {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [requestId, setRequestId] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  
  const handleCancel = async () => {
    if (!wallet.publicKey || !wallet.signTransaction) {
      setStatus('Please connect your wallet');
      return;
    }

    if (!requestId) {
      setStatus('Please enter a request ID');
      return;
    }

    // Confirmation dialog
    const confirmed = window.confirm(
      `Are you sure you want to cancel payment request "${requestId}"? This action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setLoading(true);
      setStatus('Cancelling payment request...');

      const provider = new AnchorProvider(connection, wallet as any, {});
      const program = new Program(IDL, provider);

      const [paymentRequestPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('payment_request'), Buffer.from(requestId)],
        program.programId
      );

      const tx = await program.methods
        .cancelPaymentRequest(requestId)
        .accounts({
          paymentRequest: paymentRequestPda,
          requester: wallet.publicKey,
        })
        .rpc();

      setStatus(`Success! Payment request cancelled. Transaction: ${tx}`);
      console.log('Transaction signature:', tx);
      
      // Clear form
      setRequestId('');
    } catch (error: any) {
      console.error('Error:', error);
      setStatus(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-2xl font-bold mb-4 text-red-600">Cancel Payment Request</h2>
      
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
        <p className="text-sm text-yellow-800">
          ⚠️ Warning: You can only cancel payment requests that you created and that haven't been paid yet.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Request ID
          </label>
          <input
            type="text"
            value={requestId}
            onChange={(e) => setRequestId(e.target.value)}
            placeholder="Enter the request ID to cancel"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
        </div>

        <button
          onClick={handleCancel}
          disabled={loading || !wallet.connected}
          className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Cancelling...' : 'Cancel Payment Request'}
        </button>

        {status && (
          <div className={`p-4 rounded-md ${status.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            <p className="text-sm break-all">{status}</p>
          </div>
        )}
      </div>
    </div>
  );
};