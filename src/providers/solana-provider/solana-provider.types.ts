import { AnchorWallet } from '@solana/wallet-adapter-react';
import { ReactNode } from 'react';

export interface SolanaApi {
  initialAddress?: string;
  wallet?: AnchorWallet;
  address?: string;
  disconnect: () => Promise<void>;
  signAddWallet: (mainAddress: string, inputAddress: string, timestamp: number) => Promise<string | undefined>;
  signNewAccount: (mainAddress: string, inputAddress: string, timestamp: number) => Promise<string | undefined>;
  signRemoveAccount: (account: string, timestamp: number) => Promise<string | undefined>;
  sendSignTransaction: (account: string) => Promise<string>;
  isConnected: boolean;
  isDisconnected: boolean;
  setIsConnected: (isConnecting: boolean) => void;
}

export interface SolanaProviderProps {
  children: ReactNode;
}
