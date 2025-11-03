'use client';

import { FC, useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Program, AnchorProvider } from '@coral-xyz/anchor';
import { PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import { 
  getAssociatedTokenAddress, 
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  createSyncNativeInstruction,
  NATIVE_MINT
} from '@solana/spl-token';
import { IDL, SolanaX402 } from '../idl/solana_x402';

export const VerifyPayment: FC = () => {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [requestId, setRequestId] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingInfo, setFetchingInfo] = useState(false);
  const [status, setStatus] = useState('');
  const [treasuryWallet, setTreasuryWallet] = useState<string>('');
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentAmountSOL, setPaymentAmountSOL] = useState<string>('');

  // Fetch payment request details when Request ID is entered
  const fetchPaymentDetails = async () => {
    if (!requestId || !wallet.publicKey) {
      setStatus('Please connect your wallet and enter a Request ID');
      return;
    }

    try {
      setFetchingInfo(true);
      setStatus('Fetching payment details...');
      setTreasuryWallet('');
      setPaymentAmount('');
      setPaymentAmountSOL('');
      
      const provider = new AnchorProvider(
        connection, 
        wallet as any, 
        {
          commitment: 'confirmed'
        }
      );
      const program = new Program<SolanaX402>(IDL, provider);

      // First, check if config exists
      const [configPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('config2')],
        new PublicKey(IDL.address)
      );

      console.log('Config PDA:', configPda.toBase58());

      const configInfo = await connection.getAccountInfo(configPda);
      
      if (!configInfo) {
        setStatus('Error: Config not initialized. Please go to "Initialize Config" tab and initialize the system first.');
        setFetchingInfo(false);
        return;
      }

      console.log('Config found, decoding...');
      
      let config;
      try {
        config = program.coder.accounts.decode(
          'paymentConfig',
          configInfo.data
        );
        console.log('Config decoded:', config);
      } catch (decodeError) {
        console.error('Error decoding config:', decodeError);
        setStatus('Error: Failed to decode config data');
        setFetchingInfo(false);
        return;
      }

      // Now fetch payment request
      const [paymentRequestPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('payment_request'), Buffer.from(requestId)],
        new PublicKey(IDL.address)
      );

      console.log('Payment Request PDA:', paymentRequestPda.toBase58());

      const accountInfo = await connection.getAccountInfo(paymentRequestPda);
      if (!accountInfo) {
        setStatus('Error: Payment request not found. Please check the Request ID.');
        setFetchingInfo(false);
        return;
      }

      console.log('Payment request found, decoding...');

      let paymentRequest;
      try {
        paymentRequest = program.coder.accounts.decode(
          'paymentRequest',
          accountInfo.data
        );
        console.log('Payment request decoded:', paymentRequest);
      } catch (decodeError) {
        console.error('Error decoding payment request:', decodeError);
        setStatus('Error: Failed to decode payment request data');
        setFetchingInfo(false);
        return;
      }

      if (paymentRequest.isPaid) {
        setStatus('❌ Error: This payment request has already been paid.');
        setFetchingInfo(false);
        return;
      }

      setTreasuryWallet(config.treasuryWallet.toBase58());
      setPaymentAmount(paymentRequest.amount.toString());
      
      // Convert to SOL (9 decimals)
      const amountInSOL = (Number(paymentRequest.amount) / 1e9).toFixed(9);
      setPaymentAmountSOL(amountInSOL);
      
      setStatus(`✅ Payment details loaded! Amount: ${amountInSOL} SOL`);
    } catch (error: any) {
      console.error('Error fetching details:', error);
      setStatus(`❌ Error: ${error.message}`);
      setTreasuryWallet('');
      setPaymentAmount('');
      setPaymentAmountSOL('');
    } finally {
      setFetchingInfo(false);
    }
  };

  const handleVerify = async () => {
    if (!wallet.publicKey || !wallet.signTransaction) {
      setStatus('Please connect your wallet');
      return;
    }

    if (!requestId) {
      setStatus('Please enter a Request ID');
      return;
    }

    if (!treasuryWallet || !paymentAmount) {
      setStatus('Please fetch payment details first by clicking "Fetch Details"');
      return;
    }

    try {
      setLoading(true);
      setStatus('Processing payment...');

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

      const [configPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('config2')],
        new PublicKey(IDL.address)
      );

      const treasuryPubkey = new PublicKey(treasuryWallet);

      // Get associated token accounts for wSOL
      const payerTokenAccount = await getAssociatedTokenAddress(
        NATIVE_MINT,
        wallet.publicKey
      );

      const treasuryTokenAccount = await getAssociatedTokenAddress(
        NATIVE_MINT,
        treasuryPubkey
      );

      // Check if payer's wSOL account exists, create if not
      const payerAccountInfo = await connection.getAccountInfo(payerTokenAccount);
      if (!payerAccountInfo) {
        setStatus('Creating your wSOL account...');
        const createPayerIx = createAssociatedTokenAccountInstruction(
          wallet.publicKey,
          payerTokenAccount,
          wallet.publicKey,
          NATIVE_MINT
        );
        
        const tx = new Transaction().add(createPayerIx);
        const sig = await wallet.sendTransaction(tx, connection);
        await connection.confirmTransaction(sig, 'confirmed');
        console.log('Payer wSOL account created:', sig);
      }

      // Check if treasury's wSOL account exists
      const treasuryAccountInfo = await connection.getAccountInfo(treasuryTokenAccount);
      if (!treasuryAccountInfo) {
        setStatus('Creating treasury wSOL account...');
        const createTreasuryIx = createAssociatedTokenAccountInstruction(
          wallet.publicKey, // Payer
          treasuryTokenAccount,
          treasuryPubkey,
          NATIVE_MINT
        );
        
        const tx = new Transaction().add(createTreasuryIx);
        const sig = await wallet.sendTransaction(tx, connection);
        await connection.confirmTransaction(sig, 'confirmed');
        console.log('Treasury wSOL account created:', sig);
      }

      // Transfer SOL to wSOL account and sync
      setStatus('Wrapping SOL...');
      const transferIx = SystemProgram.transfer({
        fromPubkey: wallet.publicKey,
        toPubkey: payerTokenAccount,
        lamports: Number(paymentAmount),
      });

      const syncIx = createSyncNativeInstruction(payerTokenAccount);
      
      const wrapTx = new Transaction().add(transferIx, syncIx);
      const wrapSig = await wallet.sendTransaction(wrapTx, connection);
      await connection.confirmTransaction(wrapSig, 'confirmed');
      console.log('SOL wrapped:', wrapSig);

      // Now execute the payment
      setStatus('Executing payment...');
      const tx = await program.methods
        .verifyPayment(requestId)
        .accounts({
          paymentRequest: paymentRequestPda,
          config: configPda,
          payer: wallet.publicKey,
          payerTokenAccount: payerTokenAccount,
          treasuryTokenAccount: treasuryTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();

      setStatus(`Success! Payment completed. Transaction: ${tx}`);
      console.log('Payment transaction:', tx);
      console.log('Explorer:', `https://explorer.solana.com/tx/${tx}?cluster=devnet`);
      
      // Clear form after success
      setTimeout(() => {
        setRequestId('');
        setTreasuryWallet('');
        setPaymentAmount('');
        setPaymentAmountSOL('');
      }, 3000);
    } catch (error: any) {
      console.error('Error:', error);
      let errorMessage = error.message || 'Unknown error occurred';
      
      if (error.logs) {
        console.error('Transaction logs:', error.logs);
      }
      
      if (errorMessage.includes('insufficient funds')) {
        errorMessage = 'Insufficient SOL balance to complete payment';
      } else if (errorMessage.includes('0x0')) {
        errorMessage = 'Program error. Check console logs for details.';
      }
      
      setStatus(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-8">
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
        <p className="text-sm text-blue-900 font-medium">
          Payments are made in <strong className="font-semibold">SOL (Wrapped SOL)</strong> on Devnet
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Request ID
          </label>
          <div className="flex gap-3">
            <input
              type="text"
              value={requestId}
              onChange={(e) => setRequestId(e.target.value)}
              placeholder="Enter the request ID"
              disabled={loading || fetchingInfo}
              className="flex-1 px-4 py-3 bg-white border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors text-sm"
            />
            <button
              onClick={fetchPaymentDetails}
              disabled={!requestId || fetchingInfo || loading}
              className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-md disabled:opacity-50 transition-colors font-medium text-sm"
            >
              {fetchingInfo ? 'Loading...' : 'Fetch Details'}
            </button>
          </div>
        </div>

        {paymentAmountSOL && (
          <div className="bg-green-50 border border-green-200 rounded-md p-5">
            <h3 className="font-semibold text-gray-900 mb-3">Payment Details</h3>
            <div className="space-y-2 text-sm">
              <p><span className="text-gray-600 font-medium">Amount:</span> <span className="text-gray-900">{paymentAmountSOL} SOL</span></p>
              <p><span className="text-gray-600 font-medium">Amount (lamports):</span> <span className="text-gray-900">{paymentAmount}</span></p>
              <p className="text-xs break-all font-mono"><span className="text-gray-600 font-medium">Treasury:</span> <span className="text-gray-900">{treasuryWallet}</span></p>
            </div>
          </div>
        )}

        <button
          onClick={handleVerify}
          disabled={loading || !wallet.connected || !treasuryWallet || fetchingInfo}
          className="w-full bg-gray-900 text-white py-3 px-4 rounded-md hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {loading ? 'Processing Payment...' : `Pay ${paymentAmountSOL ? paymentAmountSOL + ' SOL' : ''}`}
        </button>

        {status && (
          <div className={`p-4 rounded-md border text-sm ${
            status.includes('Error') 
              ? 'bg-red-50 border-red-200 text-red-900' 
              : status.includes('Success') 
                ? 'bg-green-50 border-green-200 text-green-900' 
                : 'bg-blue-50 border-blue-200 text-blue-900'
          }`}>
            <p className="break-all whitespace-pre-wrap font-medium">{status}</p>
          </div>
        )}
      </div>
    </div>
  );
};