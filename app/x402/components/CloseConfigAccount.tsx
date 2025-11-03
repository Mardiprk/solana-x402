'use client';

import { FC, useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Program, AnchorProvider } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import { IDL, SolanaX402 } from '../idl/solana_x402';

export const CloseConfigAccount: FC = () => {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const PROGRAM_ID = new PublicKey('2HkEaAhDkTbN9wpVyky8Gmh79xUxRRRiwrqkc8tTUArQ');

  const closeConfigAccount = async () => {
    if (!wallet.publicKey || !wallet.signTransaction) {
      setStatus('Please connect wallet');
      return;
    }

    try {
      setLoading(true);
      setStatus('Closing config account...');

      const provider = new AnchorProvider(connection, wallet as any, {
        commitment: 'confirmed',
        preflightCommitment: 'confirmed'
      });
      
      const program = new Program<SolanaX402>(IDL, provider);

      const [configPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('config2')],
        PROGRAM_ID
      );

      // Check if account exists
      const accountInfo = await connection.getAccountInfo(configPda);
      if (!accountInfo) {
        setStatus('No config account found to close.');
        setLoading(false);
        return;
      }

      // Check if closeConfig method exists (IDL might not be updated yet)
      if (!('closeConfig' in program.methods)) {
        setStatus('Error: closeConfig instruction not found in IDL. Please rebuild the program and regenerate the IDL first.');
        setLoading(false);
        return;
      }

      const tx = await (program.methods as any)
        .closeConfig()
        .accounts({
          authority: wallet.publicKey,
          config: configPda,
        })
        .rpc();

      setStatus(`Success! Config account closed. Transaction: ${tx}`);
      console.log('Transaction signature:', tx);
      console.log('Explorer:', `https://explorer.solana.com/tx/${tx}?cluster=devnet`);
    } catch (error: any) {
      console.error('Error:', error);
      
      let errorMessage = error.message || 'Unknown error';
      
      if (error.logs) {
        console.error('Transaction logs:', error.logs);
      }

      setStatus(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const checkAccount = async (seed: string) => {
    if (!wallet.publicKey) {
      setStatus('Please connect wallet');
      return;
    }

    try {
      setLoading(true);
      const [pda] = PublicKey.findProgramAddressSync(
        [Buffer.from(seed)],
        PROGRAM_ID
      );

      console.log(`Checking PDA for seed "${seed}":`, pda.toBase58());

      const accountInfo = await connection.getAccountInfo(pda);
      
      if (accountInfo) {
        setStatus(`Found account at ${pda.toBase58()}. Owner: ${accountInfo.owner.toBase58()}, Size: ${accountInfo.data.length} bytes.`);
      } else {
        setStatus(`No account found at ${pda.toBase58()} for seed "${seed}"`);
      }
    } catch (error: any) {
      setStatus(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-8">
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-sm text-red-900 font-medium">
            <strong className="font-semibold">Warning:</strong> This will close the config account and return rent to your wallet. 
            Use this if you have a corrupted config account that can't be initialized. After closing, 
            you'll be able to initialize a new config account.
          </p>
        </div>

        <button
          onClick={closeConfigAccount}
          disabled={loading || !wallet.connected}
          className="w-full bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {loading ? 'Closing...' : 'Close Config Account'}
        </button>

        <div className="border-t border-gray-200 pt-6">
          <h3 className="font-semibold mb-4 text-gray-900">Check Accounts</h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => checkAccount('config')}
              disabled={loading || !wallet.connected}
              className="bg-gray-100 hover:bg-gray-200 text-gray-900 py-2 px-4 rounded-md disabled:opacity-50 text-sm transition-colors font-medium"
            >
              Check 'config'
            </button>

            <button
              onClick={() => checkAccount('config2')}
              disabled={loading || !wallet.connected}
              className="bg-gray-100 hover:bg-gray-200 text-gray-900 py-2 px-4 rounded-md disabled:opacity-50 text-sm transition-colors font-medium"
            >
              Check 'config2'
            </button>
          </div>
        </div>

        {status && (
          <div className={`p-4 rounded-md border text-sm ${
            status.includes('Success') || status.includes('closed')
              ? 'bg-green-50 border-green-200 text-green-900' 
              : 'bg-gray-50 border-gray-200 text-gray-700'
          }`}>
            <p className="break-all font-mono">{status}</p>
          </div>
        )}
      </div>
    </div>
  );
};
