'use client';

import { FC, useState, useEffect } from 'react';
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
  const [existingConfig, setExistingConfig] = useState<any>(null);
  const [checkingConfig, setCheckingConfig] = useState(false);

  // Auto-fill treasury with connected wallet
  useEffect(() => {
    if (wallet.publicKey && !treasuryWallet) {
      setTreasuryWallet(wallet.publicKey.toBase58());
    }
  }, [wallet.publicKey]);

  // Check if config already exists
  useEffect(() => {
    if (wallet.publicKey) {
      checkExistingConfig();
    }
  }, [wallet.publicKey]);

  const checkExistingConfig = async () => {
    if (!wallet.publicKey) return;

    try {
      setCheckingConfig(true);
      const provider = new AnchorProvider(connection, wallet as any, {});
      const program = new Program<SolanaX402>(IDL, provider);

      const [configPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('config2')],
        new PublicKey(IDL.address)
      );

      const accountInfo = await connection.getAccountInfo(configPda);
      
      if (accountInfo) {
        try {
          const config = program.coder.accounts.decode(
            'paymentConfig',
            accountInfo.data
          );
          setExistingConfig(config);
        } catch (decodeError) {
          console.error('Failed to decode config:', decodeError);
        }
      } else {
        setExistingConfig(null);
      }
    } catch (error: any) {
      console.error('Error checking config:', error);
    } finally {
      setCheckingConfig(false);
    }
  };

  const handleInitialize = async () => {
    if (!wallet.publicKey || !wallet.signTransaction) {
      setStatus('Please connect your wallet');
      return;
    }

    if (!treasuryWallet || !minPaymentAmount) {
      setStatus('Please fill in all fields');
      return;
    }

    // Validate treasury wallet
    try {
      new PublicKey(treasuryWallet);
    } catch {
      setStatus('Error: Invalid treasury wallet address');
      return;
    }

    // Validate amount
    if (isNaN(Number(minPaymentAmount)) || Number(minPaymentAmount) <= 0) {
      setStatus('Error: Invalid minimum payment amount');
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
        [Buffer.from('config2')],
        new PublicKey(IDL.address)
      );

      // Check if config already exists - use getAccountInfo (doesn't deserialize)
      const accountInfo = await connection.getAccountInfo(configPda);
      if (accountInfo) {
        // Account exists, try to decode it
        try {
          const decodedConfig = program.coder.accounts.decode(
            'paymentConfig',
            accountInfo.data
          );
          // Successfully decoded - config already initialized
          setStatus('Error: Config already initialized. You can only initialize once.');
          setLoading(false);
          await checkExistingConfig();
          return;
        } catch (decodeError) {
          // Account exists but can't be decoded - corrupted account
          setStatus(`Error: Config account exists at ${configPda.toBase58()} but contains invalid/corrupted data. This usually happens after a program redeploy. Go to the "Debug" tab and use the "Close Config Account" button to close the corrupted account, then try initializing again.`);
          setLoading(false);
          return;
        }
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

      setStatus(`Success! Config initialized. Transaction: ${tx}`);
      console.log('Transaction signature:', tx);
      console.log('Config PDA:', configPda.toBase58());
      console.log('Explorer:', `https://explorer.solana.com/tx/${tx}?cluster=devnet`);
      
      // Refresh config display
      setTimeout(() => {
        checkExistingConfig();
      }, 2000);
    } catch (error: any) {
      console.error('Error:', error);
      
      let errorMessage = error.message || 'Unknown error';
      
      if (error.logs) {
        console.error('Transaction logs:', error.logs);
      }

      // Check for specific Anchor errors
      if (error.error?.errorCode?.code === 'AccountDidNotDeserialize' || 
          error.code === 3003 ||
          errorMessage.includes('AccountDidNotDeserialize')) {
        const [configPda] = PublicKey.findProgramAddressSync(
          [Buffer.from('config2')],
          new PublicKey(IDL.address)
        );
        errorMessage = `Config account exists at ${configPda.toBase58()} but contains invalid/corrupted data. This typically happens after redeploying the program. Go to the "Debug" tab and use the "Close Config Account" button to close the corrupted account, then try initializing again.`;
      } else if (errorMessage.includes('already in use')) {
        errorMessage = 'Config already initialized';
      }

      setStatus(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-8">
      {checkingConfig && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
          <p className="text-sm text-blue-900 font-medium">Checking existing configuration...</p>
        </div>
      )}

      {existingConfig && (
        <div className="bg-green-50 border border-green-200 rounded-md p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Config Already Initialized</h3>
          <div className="space-y-3 text-sm">
            <div>
              <span className="text-gray-600 font-medium">Authority:</span>
              <p className="text-xs break-all font-mono mt-1 text-gray-900">{existingConfig.authority.toBase58()}</p>
            </div>
            <div>
              <span className="text-gray-600 font-medium">Treasury:</span>
              <p className="text-xs break-all font-mono mt-1 text-gray-900">{existingConfig.treasuryWallet.toBase58()}</p>
            </div>
            <div>
              <span className="text-gray-600 font-medium">Min Payment:</span>
              <p className="mt-1 text-gray-900">{existingConfig.minPaymentAmount.toString()} lamports ({(Number(existingConfig.minPaymentAmount) / 1e9).toFixed(9)} SOL)</p>
            </div>
            <div>
              <span className="text-gray-600 font-medium">Total Processed:</span>
              <p className="mt-1 text-gray-900">{existingConfig.totalPaymentProcessed.toString()}</p>
            </div>
          </div>
          <p className="text-xs text-gray-600 mt-4">The system is ready. You can now create payment requests.</p>
          <button
            onClick={checkExistingConfig}
            disabled={checkingConfig}
            className="mt-4 w-full bg-gray-100 hover:bg-gray-200 text-gray-900 py-2.5 px-4 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
          >
            {checkingConfig ? 'Refreshing...' : 'Refresh Config'}
          </button>
        </div>
      )}

      {!existingConfig && (
        <>
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
            <p className="text-sm text-yellow-900 font-medium">
              This should only be done ONCE when first setting up the payment system.
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Treasury Wallet Address
              </label>
              <input
                type="text"
                value={treasuryWallet}
                onChange={(e) => setTreasuryWallet(e.target.value)}
                placeholder="Enter treasury wallet address"
                disabled={loading}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors font-mono text-sm"
              />
              <p className="mt-2 text-xs text-gray-500">
                The wallet address where all payments will be received. Automatically set to your connected wallet.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Minimum Payment Amount (lamports)
              </label>
              <input
                type="number"
                value={minPaymentAmount}
                onChange={(e) => setMinPaymentAmount(e.target.value)}
                placeholder="e.g., 100000000 for 0.1 SOL"
                disabled={loading}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors text-sm"
              />
              <div className="mt-2 text-xs text-gray-500 space-y-1">
                <p>1 SOL = 1,000,000,000 lamports</p>
                <p>0.1 SOL = 100,000,000 lamports</p>
                <p>0.01 SOL = 10,000,000 lamports</p>
              </div>
            </div>

            <button
              onClick={handleInitialize}
              disabled={loading || !wallet.connected}
              className="w-full bg-gray-900 text-white py-3 px-4 rounded-md hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {loading ? 'Initializing...' : 'Initialize Config'}
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
        </>
      )}
    </div>
  );
};
