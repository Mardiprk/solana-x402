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
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-8">
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
        <p className="text-sm text-yellow-900 font-medium">
          <strong className="font-semibold">Warning:</strong> You can only cancel payment requests that you created and that haven't been paid yet.
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Request ID
          </label>
          <input
            type="text"
            value={requestId}
            onChange={(e) => setRequestId(e.target.value)}
            placeholder="Enter the request ID to cancel"
            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-colors text-sm"
          />
        </div>

        <button
          onClick={handleCancel}
          disabled={loading || !wallet.connected}
          className="w-full bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {loading ? 'Cancelling...' : 'Cancel Payment Request'}
        </button>

        {status && (
          <div className={`p-4 rounded-md border text-sm ${
            status.includes('Error') 
              ? 'bg-red-50 border-red-200 text-red-900' 
              : 'bg-green-50 border-green-200 text-green-900'
          }`}>
            <p className="break-all font-medium">{status}</p>
          </div>
        )}
      </div>
    </div>
  );
};
