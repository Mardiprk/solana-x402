'use client';

import { FC, useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Program, AnchorProvider, BN } from '@coral-xyz/anchor';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import { IDL, SolanaX402 } from '../idl/solana_x402';

export const InitializeConfig: FC = () => {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [treasuryWallet, setTreasuryWallet] = useState('');
  const [minPaymentAmount, setMinPaymentAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  const handleInitialize = async () => {
    if (!wallet.publicKey || !wallet.signTransaction) {
      setStatus('Please connect your wallet');
      return;
    }

    if (!treasuryWallet || !minPaymentAmount) {
      setStatus('Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      setStatus('Initializing...');

      const provider = new AnchorProvider(
        connection, 
        wallet as any, 
        {
          commitment: 'confirmed',
          preflightCommitment: 'confirmed'
        }
      );
      const program = new Program<SolanaX402>(IDL, provider);

      const [configPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('config')],
        new PublicKey(IDL.address)
      );

      // Check if config already exists
      const existingConfig = await connection.getAccountInfo(configPda);
      if (existingConfig) {
        setStatus('Error: Config already initialized. You can only initialize once.');
        setLoading(false);
        return;
      }

      const treasuryPubkey = new PublicKey(treasuryWallet);
      const minAmount = new BN(minPaymentAmount);

      const tx = await program.methods
        .initializeConfig(treasuryPubkey, minAmount)
        .accounts({
          authority: wallet.publicKey,
          config: configPda,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      setStatus(`✅ Success! Config initialized. Transaction: ${tx}`);
      console.log('Transaction signature:', tx);
      console.log('Config PDA:', configPda.toBase58());
    } catch (error: any) {
      console.error('Error:', error);
      
      let errorMessage = error.message || 'Unknown error';
      
      if (error.logs) {
        console.error('Transaction logs:', error.logs);
      }

      if (errorMessage.includes('already in use')) {
        errorMessage = 'Config already initialized';
      }

      setStatus(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-2xl font-bold mb-4">Initialize Config</h2>
      
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
        <p className="text-sm text-yellow-800">
          ⚠️ This should only be done ONCE when first setting up the payment system!
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Treasury Wallet Address
          </label>
          <input
            type="text"
            value={treasuryWallet}
            onChange={(e) => setTreasuryWallet(e.target.value)}
            placeholder="Enter treasury wallet address (where payments go)"
            disabled={loading}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
          />
          <p className="text-xs text-gray-500 mt-1">
            Use your wallet address or a dedicated treasury address
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Minimum Payment Amount (in lamports)
          </label>
          <input
            type="number"
            value={minPaymentAmount}
            onChange={(e) => setMinPaymentAmount(e.target.value)}
            placeholder="e.g., 1000000000 for 1 SOL"
            disabled={loading}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
          />
          <p className="text-xs text-gray-500 mt-1">
            1 SOL = 1,000,000,000 lamports (9 decimals)
          </p>
        </div>

        <button
          onClick={handleInitialize}
          disabled={loading || !wallet.connected}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Initializing...' : 'Initialize Config'}
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