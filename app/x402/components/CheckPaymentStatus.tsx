'use client';

import { FC, useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Program, AnchorProvider } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import { IDL, SolanaX402 } from "../idl/solana_x402";

export const CheckPaymentStatus: FC = () => {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [requestId, setRequestId] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [paymentData, setPaymentData] = useState<any>(null);

  const handleCheck = async () => {
    if (!wallet.publicKey) {
      setStatus('Please connect your wallet');
      return;
    }

    if (!requestId) {
      setStatus('Please enter a request ID');
      return;
    }

    try {
      setLoading(true);
      setStatus('Checking payment status...');
      setPaymentData(null);

      const provider = new AnchorProvider(connection, wallet as any, {});
      const program = new Program<SolanaX402>(IDL, provider);

      const [paymentRequestPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('payment_request'), Buffer.from(requestId)],
        new PublicKey(IDL.address)
      );

      // Fetch the payment request account using the account discriminator
      const accountInfo = await connection.getAccountInfo(paymentRequestPda);
      
      if (!accountInfo) {
        setStatus(`Error: Payment request with ID "${requestId}" not found. Make sure the Request ID is correct and the payment request has been created.`);
        setLoading(false);
        return;
      }

      // Decode the account data
      const paymentRequest = program.coder.accounts.decode(
        'paymentRequest',
        accountInfo.data
      );

      setPaymentData(paymentRequest);
      setStatus('Payment status retrieved successfully!');
      
      console.log('Payment Request Data:', paymentRequest);
    } catch (error: any) {
      console.error('Error:', error);
      setStatus(`Error: ${error.message || 'Payment request not found'}`);
      setPaymentData(null);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: number) => {
    if (timestamp === 0) return 'Not paid yet';
    return new Date(timestamp * 1000).toLocaleString();
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-8">
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Request ID
          </label>
          <input
            type="text"
            value={requestId}
            onChange={(e) => setRequestId(e.target.value)}
            placeholder="Enter the request ID to check"
            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-md text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-colors text-sm"
          />
        </div>

        <button
          onClick={handleCheck}
          disabled={loading || !wallet.connected}
          className="w-full bg-gray-900 text-white py-3 px-4 rounded-md hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {loading ? 'Checking...' : 'Check Status'}
        </button>

        {status && !paymentData && (
          <div className={`p-4 rounded-md border text-sm ${
            status.includes('Error') 
              ? 'bg-red-50 border-red-200 text-red-900' 
              : 'bg-blue-50 border-blue-200 text-blue-900'
          }`}>
            <p className="break-all font-medium">{status}</p>
          </div>
        )}

        {paymentData && (
          <div className="mt-4 p-6 bg-gray-50 rounded-md border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Details</h3>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-gray-600 font-medium">Request ID:</span>
                <span className="text-gray-900 font-mono">{paymentData.requestId}</span>
              </div>
              
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-gray-600 font-medium">Amount:</span>
                <span className="text-gray-900">{paymentData.amount.toString()} lamports</span>
              </div>
              
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-gray-600 font-medium">Resource:</span>
                <span className="text-gray-900 break-all text-right max-w-xs">{paymentData.resourceIdentifier}</span>
              </div>
              
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-gray-600 font-medium">Status:</span>
                <span className={`font-semibold ${paymentData.isPaid ? 'text-green-600' : 'text-yellow-600'}`}>
                  {paymentData.isPaid ? 'PAID' : 'PENDING'}
                </span>
              </div>
              
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-gray-600 font-medium">Requester:</span>
                <span className="text-gray-900 text-xs break-all font-mono text-right max-w-xs">{paymentData.requester.toBase58()}</span>
              </div>
              
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-gray-600 font-medium">Created At:</span>
                <span className="text-gray-900">{formatDate(paymentData.createdAt.toNumber())}</span>
              </div>
              
              {paymentData.isPaid && (
                <>
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600 font-medium">Paid By:</span>
                    <span className="text-gray-900 text-xs break-all font-mono text-right max-w-xs">{paymentData.payer.toBase58()}</span>
                  </div>
                  
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600 font-medium">Paid At:</span>
                    <span className="text-gray-900">{formatDate(paymentData.paidAt.toNumber())}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
