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
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-2xl font-bold mb-4">Create Payment Request</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Request ID (max 64 characters)
          </label>
          <input
            type="text"
            value={requestId}
            onChange={(e) => setRequestId(e.target.value)}
            placeholder="e.g., payment-001"
            maxLength={64}
            disabled={loading}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Amount (in smallest token units)
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="e.g., 5000000 for 5 tokens with 6 decimals"
            disabled={loading}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Resource Identifier (max 128 characters)
          </label>
          <input
            type="text"
            value={resourceIdentifier}
            onChange={(e) => setResourceIdentifier(e.target.value)}
            placeholder="e.g., product-123 or service-xyz"
            maxLength={128}
            disabled={loading}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
          />
        </div>

        <button
          onClick={handleCreate}
          disabled={loading || !wallet.connected}
          className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Creating...' : 'Create Payment Request'}
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