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
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-2xl font-bold mb-4">Check Payment Status</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Request ID
          </label>
          <input
            type="text"
            value={requestId}
            onChange={(e) => setRequestId(e.target.value)}
            placeholder="Enter the request ID to check"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <button
          onClick={handleCheck}
          disabled={loading || !wallet.connected}
          className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Checking...' : 'Check Status'}
        </button>

        {status && !paymentData && (
          <div className={`p-4 rounded-md ${status.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
            <p className="text-sm break-all">{status}</p>
          </div>
        )}

        {paymentData && (
          <div className="mt-4 p-4 bg-gray-50 rounded-md border border-gray-200">
            <h3 className="font-semibold text-lg mb-3">Payment Details</h3>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Request ID:</span>
                <span className="text-gray-900">{paymentData.requestId}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Amount:</span>
                <span className="text-gray-900">{paymentData.amount.toString()}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Resource:</span>
                <span className="text-gray-900 break-all">{paymentData.resourceIdentifier}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Status:</span>
                <span className={`font-semibold ${paymentData.isPaid ? 'text-green-600' : 'text-yellow-600'}`}>
                  {paymentData.isPaid ? '✓ PAID' : '⏳ PENDING'}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Requester:</span>
                <span className="text-gray-900 text-xs break-all">{paymentData.requester.toBase58()}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Created At:</span>
                <span className="text-gray-900">{formatDate(paymentData.createdAt.toNumber())}</span>
              </div>
              
              {paymentData.isPaid && (
                <>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Paid By:</span>
                    <span className="text-gray-900 text-xs break-all">{paymentData.payer.toBase58()}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Paid At:</span>
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