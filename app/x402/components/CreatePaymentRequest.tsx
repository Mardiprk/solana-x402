'use client';

import { FC, useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Program, AnchorProvider, web3, BN } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import { IDL, SolanaX402 } from '../idl/solana_x402';

export const CreatePaymentRequest: FC = () => {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [requestId, setRequestId] = useState('');
  const [amount, setAmount] = useState('');
  const [resourceIdentifier, setResourceIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  const handleCreate = async () => {
    if (!wallet.publicKey || !wallet.signTransaction) {
      setStatus('Please connect your wallet');
      return;
    }

    if (!requestId || !amount || !resourceIdentifier) {
      setStatus('Please fill in all fields');
      return;
    }

    // Prevent double submission
    if (loading) {
      return;
    }

    try {
      setLoading(true);
      setStatus('Creating payment request...');

      const provider = new AnchorProvider(
        connection, 
        wallet as any, 
        { 
          commitment: 'confirmed',
          preflightCommitment: 'confirmed'
        }
      );
      const program = new Program<SolanaX402>(IDL, provider);

      const [paymentRequestPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('payment_request'), Buffer.from(requestId)],
        new PublicKey(IDL.address)
      );

      // Check if the payment request already exists
      try {
        const existingAccount = await connection.getAccountInfo(paymentRequestPda);
        if (existingAccount) {
          setStatus('Error: A payment request with this ID already exists. Please use a different Request ID.');
          setLoading(false);
          return;
        }
      } catch (e) {
        // Account doesn't exist, which is what we want
      }

      const amountBN = new BN(amount);

      const tx = await program.methods
        .createPaymentRequest(requestId, amountBN, resourceIdentifier)
        .accounts({
          requester: wallet.publicKey,
          paymentRequest: paymentRequestPda,
          systemProgram: web3.SystemProgram.programId,
        })
        .rpc({
          skipPreflight: false,
          commitment: 'confirmed'
        });

      setStatus(`Success! Transaction: ${tx}`);
      console.log('Transaction signature:', tx);
      console.log('Payment Request PDA:', paymentRequestPda.toBase58());
      
      // Wait a bit before clearing to show success message
      setTimeout(() => {
        setRequestId('');
        setAmount('');
        setResourceIdentifier('');
      }, 2000);
    } catch (error: any) {
      console.error('Error:', error);
      
      // Better error handling
      let errorMessage = 'Unknown error occurred';
      
      if (error.message) {
        errorMessage = error.message;
      }
      
      if (error.logs) {
        console.error('Transaction logs:', error.logs);
        errorMessage += '\nCheck console for detailed logs';
      }
      
      // Check for specific error codes
      if (errorMessage.includes('already in use')) {
        errorMessage = 'This Request ID already exists. Please use a different one.';
      } else if (errorMessage.includes('insufficient funds')) {
        errorMessage = 'Insufficient SOL for transaction fees.';
      }
      
      setStatus(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-8">
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Request ID (max 64 characters)
          </label>
          <input
            type="text"
            value={requestId}
            onChange={(e) => setRequestId(e.target.value)}
            placeholder="e.g., payment-001"
            maxLength={64}
            disabled={loading}
            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Amount (in smallest token units)
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="e.g., 5000000 for 5 tokens with 6 decimals"
            disabled={loading}
            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Resource Identifier (max 128 characters)
          </label>
          <input
            type="text"
            value={resourceIdentifier}
            onChange={(e) => setResourceIdentifier(e.target.value)}
            placeholder="e.g., product-123 or service-xyz"
            maxLength={128}
            disabled={loading}
            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors text-sm"
          />
        </div>

        <button
          onClick={handleCreate}
          disabled={loading || !wallet.connected}
          className="w-full bg-gray-900 text-white py-3 px-4 rounded-md hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {loading ? 'Creating...' : 'Create Payment Request'}
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
