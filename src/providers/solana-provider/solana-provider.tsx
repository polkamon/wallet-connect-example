import { SolanaProviderProps } from './solana-provider.types';
import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { SolanaApi } from './solana-provider.types';
import { AnchorWallet, useAnchorWallet, useConnection, useWallet } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';

const defaultContext: SolanaApi = {
  initialAddress: undefined,
  wallet: undefined,
  address: undefined,
  disconnect: async () => undefined,
  signAddWallet: async () => undefined,
  signNewAccount: async () => undefined,
  signRemoveAccount: async () => undefined,
  sendSignTransaction: async () => '',
  isConnected: false,
  isDisconnected: true,
  setIsConnected: () => undefined
};

export function toArrayString(bytes: Uint8Array): string {
    return JSON.stringify([...bytes]);
}

declare const CHAIN_IDS: readonly ("mainnet-beta" | "devnet" | "testnet" | "1" | "4" | "5" | "56" | "97" | "137" | "80001")[];
export type ChainId = (typeof CHAIN_IDS)[number];

export const SolanaChainId: ChainId = (process.env.NEXT_PUBLIC_SOLANA_NETWORK as ChainId) || 'mainnet-beta';

export const SolanaContext = createContext(defaultContext);

export const SolanaProvider = ({ children }: SolanaProviderProps) => {
  const { signMessage, disconnect: walletDisconnect, sendTransaction } = useWallet();
  const anchorWallet = useAnchorWallet();
  const { connection } = useConnection();
  const [isConnected, setIsConnected] = useState(false);
  const [currentWallet, setCurrentWallet] = useState<AnchorWallet | undefined>();
  const [initialWallet, setInitialWallet] = useState<string | undefined>();
  const [isDisconnected, setIsDisconnected] = useState(true);

  const disconnect = useCallback(async () => {
    await walletDisconnect();
    setCurrentWallet(undefined);
  }, [walletDisconnect]);

  const sign = useCallback(
    async (message: string) => {
      if (signMessage) {
        const encodedMessage = new TextEncoder().encode(message);
        const signedMessage = await signMessage(encodedMessage);
        return toArrayString(signedMessage);
      }
      return undefined;
    },
    [signMessage]
  );

  const signAddWallet = useCallback(
    async (mainAddress: string, inputAddress: string, timestamp: number) => {
      return await sign(`connect:${mainAddress}=>${inputAddress}-${timestamp}`);
    },
    [sign]
  );

  const signNewAccount = useCallback(
    async (address: string, accountName: string, timestamp: number) => {
      return await sign(`initUser:${address}-${accountName}-${timestamp}`);
    },
    [sign]
  );
  const signRemoveAccount = useCallback(
    async (account: string, timestamp: number) => {
      return await sign(`remove:${account}-${timestamp}`);
    },
    [sign]
  );

  const sendSignTransaction = useCallback(
    async (account: string) => {
      const amount = 0.00007 * LAMPORTS_PER_SOL; // hardcoded to 1 SOL for now

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: new PublicKey(account),
          toPubkey: new PublicKey(account),
          lamports: amount
        })
      );

      const signature = await sendTransaction(transaction, connection);

      const latestBlockHash = await connection.getLatestBlockhash();

      await connection.confirmTransaction({
        blockhash: latestBlockHash.blockhash,
        lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
        signature: signature
      });
      return signature;
    },
    [sendTransaction, connection]
  );

  // there is no other way to detect an account change on solana
  // https://stackoverflow.com/questions/12709074/how-do-you-explicitly-set-a-new-property-on-window-in-typescript
  useEffect(() => {
    const walletChangeInterval = setInterval(
      () => {
        // @ts-ignore
          const solana = window?.solana;
        if (solana?.publicKey) {
          if (solana.publicKey?.toBase58() !== currentWallet?.publicKey?.toBase58()) {
            setIsDisconnected(false);
            if (!initialWallet && solana.publicKey.toBase58()) {
              setIsConnected(true);
              setInitialWallet(solana.publicKey.toBase58());
              //Need to overwrite style setting from Solana connection manually to enable scrolling
              document.body.style.overflow = 'initial';
            }
            setCurrentWallet({
              publicKey: solana.publicKey,
              signAllTransactions: solana.signAllTransactions,
              signTransaction: solana.signTransaction
            });
          }
          // when connection through a web wallet (like Solflare), the window.solana object is not set,
          // but anchorWallet gets set upon connection
        } else if (anchorWallet && anchorWallet.publicKey.toBase58() !== currentWallet?.publicKey.toBase58()) {
          document.body.style.overflow = 'initial';
          setCurrentWallet(anchorWallet);
        }
        setIsDisconnected(!solana?.publicKey && !anchorWallet);
        setIsConnected(false);
      },
      currentWallet?.publicKey ? 1000 : 0
    );

    return () => {
      clearInterval(walletChangeInterval);
    };
  }, [anchorWallet, currentWallet, initialWallet]);

  const api = useMemo(
    () => ({
      initialAddress: initialWallet,
      wallet: currentWallet,
      address: currentWallet?.publicKey?.toBase58(),
      disconnect,
      signAddWallet,
      signNewAccount,
      signRemoveAccount,
      sendSignTransaction,
      isConnected,
      isDisconnected,
      setIsConnected
    }),
    [
      currentWallet,
      initialWallet,
      disconnect,
      signAddWallet,
      signNewAccount,
      signRemoveAccount,
      sendSignTransaction,
      isConnected,
      isDisconnected
    ]
  );

  return <SolanaContext.Provider value={api}>{children}</SolanaContext.Provider>;
};
