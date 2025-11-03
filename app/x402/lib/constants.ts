import { PublicKey } from '@solana/web3.js';

export const PROGRAM_ID = new PublicKey('2HkEaAhDkTbN9wpVyky8Gmh79xUxRRRiwrqkc8tTUArQ');

export const TOKEN_DECIMALS = 9; // SOL/wSOL uses 9 decimals

// Network configuration
export const NETWORK = 'devnet'; // Change to 'mainnet-beta' or 'testnet' as needed

// Explorer URL based on network
export const EXPLORER_URL = NETWORK === 'mainnet-beta' 
  ? 'https://explorer.solana.com'  // Mainnet doesn't need cluster param
  : `https://explorer.solana.com/?cluster=${NETWORK}`; // Devnet/testnet need cluster param

// Native SOL Wrapped Token Mint (wSOL) - Same on all networks
export const WSOL_MINT = 'So11111111111111111111111111111111111111112';

// Common SPL Token Mints
export const COMMON_TOKENS = {
  WSOL: 'So11111111111111111111111111111111111111112', // Wrapped SOL (works on all networks)
  USDC_DEVNET: 'Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr', // Devnet USDC
};

// Default token for payments (wSOL)
export const DEFAULT_TOKEN_MINT = WSOL_MINT;

// Config seeds
export const CONFIG_SEED = 'config2';
export const PAYMENT_REQUEST_SEED = 'payment_request';

// Helper function to get explorer link for transaction
export const getExplorerLink = (signature: string) => {
  return `${EXPLORER_URL}/tx/${signature}`;
};

// Helper function to get explorer link for address
export const getExplorerAddressLink = (address: string) => {
  return `${EXPLORER_URL}/address/${address}`;
};
