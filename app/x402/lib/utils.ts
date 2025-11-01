import { PublicKey, Connection } from '@solana/web3.js';
import { TOKEN_DECIMALS, EXPLORER_URL } from './constants';

/**
 * Convert token amount from human-readable format to smallest units
 * @param amount - The amount in human-readable format (e.g., 5.5)
 * @param decimals - Number of decimals for the token (default: 6)
 * @returns The amount in smallest units
 */
export const toTokenAmount = (amount: number, decimals: number = TOKEN_DECIMALS): string => {
  return (amount * Math.pow(10, decimals)).toString();
};

/**
 * Convert token amount from smallest units to human-readable format
 * @param amount - The amount in smallest units
 * @param decimals - Number of decimals for the token (default: 6)
 * @returns The amount in human-readable format
 */
export const fromTokenAmount = (amount: string | number, decimals: number = TOKEN_DECIMALS): number => {
  return Number(amount) / Math.pow(10, decimals);
};

/**
 * Format a public key to a shortened version for display
 * @param publicKey - The public key to format
 * @param chars - Number of characters to show on each end (default: 4)
 * @returns Formatted string like "ABC...XYZ"
 */
export const shortenAddress = (publicKey: PublicKey | string, chars: number = 4): string => {
  const address = typeof publicKey === 'string' ? publicKey : publicKey.toBase58();
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
};

/**
 * Validate if a string is a valid Solana public key
 * @param address - The address string to validate
 * @returns true if valid, false otherwise
 */
export const isValidPublicKey = (address: string): boolean => {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
};

/**
 * Get explorer URL for a transaction
 * @param signature - Transaction signature
 * @returns Full explorer URL
 */
export const getExplorerUrl = (signature: string, type: 'tx' | 'address' = 'tx'): string => {
  return `${EXPLORER_URL}/${type}/${signature}`;
};

/**
 * Format timestamp to human-readable date
 * @param timestamp - Unix timestamp in seconds
 * @returns Formatted date string
 */
export const formatTimestamp = (timestamp: number): string => {
  if (timestamp === 0) return 'N/A';
  return new Date(timestamp * 1000).toLocaleString();
};

/**
 * Sleep utility for delays
 * @param ms - Milliseconds to sleep
 */
export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Get token balance for an associated token account
 * @param connection - Solana connection
 * @param tokenAccount - Token account public key
 * @returns Token balance in smallest units
 */
export const getTokenBalance = async (
  connection: Connection,
  tokenAccount: PublicKey
): Promise<number> => {
  try {
    const balance = await connection.getTokenAccountBalance(tokenAccount);
    return Number(balance.value.amount);
  } catch (error) {
    console.error('Error fetching token balance:', error);
    return 0;
  }
};

/**
 * Format amount with proper decimal places
 * @param amount - Amount to format
 * @param decimals - Number of decimal places
 * @returns Formatted string
 */
export const formatAmount = (amount: number, decimals: number = 2): string => {
  return amount.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

/**
 * Generate a random request ID
 * @param prefix - Optional prefix for the ID
 * @returns Random request ID
 */
export const generateRequestId = (prefix: string = 'req'): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  return `${prefix}-${timestamp}-${random}`;
};

/**
 * Validate request ID format
 * @param requestId - Request ID to validate
 * @returns true if valid, false otherwise
 */
export const isValidRequestId = (requestId: string): boolean => {
  return requestId.length > 0 && requestId.length <= 64;
};

/**
 * Validate resource identifier format
 * @param resourceId - Resource identifier to validate
 * @returns true if valid, false otherwise
 */
export const isValidResourceId = (resourceId: string): boolean => {
  return resourceId.length > 0 && resourceId.length <= 128;
};

/**
 * Copy text to clipboard
 * @param text - Text to copy
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
};

/**
 * Format error message for display
 * @param error - Error object
 * @returns User-friendly error message
 */
export const formatError = (error: any): string => {
  if (error?.message) {
    // Extract meaningful error from Anchor errors
    if (error.message.includes('0x')) {
      const match = error.message.match(/custom program error: (0x[0-9a-f]+)/i);
      if (match) {
        return `Program error: ${match[1]}`;
      }
    }
    return error.message;
  }
  return 'An unknown error occurred';
};