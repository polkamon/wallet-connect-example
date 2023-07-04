import { Chain, configureChains, createConfig, WagmiConfig } from 'wagmi';
import { mainnet, goerli, polygon, polygonMumbai, bscTestnet, bsc } from 'wagmi/chains';
import { MetaMaskConnector } from 'wagmi/connectors/metaMask';
import { InjectedConnector } from 'wagmi/connectors/injected';
import { WalletConnectConnector } from 'wagmi/connectors/walletConnect';
import { CoinbaseWalletConnector } from 'wagmi/connectors/coinbaseWallet';
import { JsonRpcProviderList, Web3ProviderTypes } from './web3-provider.types';
import { alchemyProvider } from 'wagmi/providers/alchemy';
import { publicProvider } from 'wagmi/providers/public';
import { SolanaWalletProvider } from './solana-wallet-connect';
import { generateJsonRpcProvider } from './utils';

const supportedChains =
  process.env.NEXT_PUBLIC_ENV === 'development' ? [goerli, polygonMumbai, bscTestnet] : [mainnet, polygon, bsc];

const ankrRpcProviderList: JsonRpcProviderList = [
  { id: mainnet.id, url: 'https://rpc.ankr.com/eth' },
  { id: goerli.id, url: 'https://rpc.ankr.com/eth_goerli' },
  { id: polygon.id, url: 'https://rpc.ankr.com/polygon' },
  { id: polygonMumbai.id, url: 'https://rpc.ankr.com/polygon_mumbai' },
  { id: bsc.id, url: 'https://rpc.ankr.com/bsc' },
  { id: bscTestnet.id, url: 'https://data-seed-prebsc-1-s1.binance.org:8545/' } // ankr unusable for bsc testnet
];

const chainlistProviderList: JsonRpcProviderList = [
  { id: mainnet.id, url: 'https://eth-rpc.gateway.pokt.network' },
  { id: goerli.id, url: 'https://eth-goerli.public.blastapi.io' },
  { id: polygon.id, url: 'https://polygon-bor.publicnode.com' },
  { id: polygonMumbai.id, url: 'https://polygon-testnet.public.blastapi.io' },
  { id: bsc.id, url: 'https://bsc-dataseed.binance.org/' },
  { id: bscTestnet.id, url: 'https://data-seed-prebsc-1-s1.binance.org:8545/' }
];

const ankrProvider = generateJsonRpcProvider(ankrRpcProviderList);
const chainlistProvider = generateJsonRpcProvider(chainlistProviderList);

const apiKey = process.env.NEXT_PUBLIC_KEY_ALCHEMY as string;

const { chains, publicClient } = configureChains<Chain>(
  supportedChains,
  [publicProvider(), ...ankrProvider, ...chainlistProvider, alchemyProvider({ apiKey })],
  {
    pollingInterval: 30_000,
    stallTimeout: 3000
  }
);

const config = createConfig({
  autoConnect: true,
  connectors: [
    new MetaMaskConnector({
      chains
    }),
    new WalletConnectConnector({
      chains,
      options: {
        projectId: process.env.NEXT_PUBLIC_PROJECT_ID as string,
        metadata: {
          name: 'Polychain Monsters',
          description: 'The largest multi-chain #NFT collecting & gaming ecosystem on #Web3.',
          url: 'https://polychainmonsters.com/',
          icons: ['https://app.polychainmonsters.com/favicon.ico']
        },
        qrModalOptions: {
          //See https://docs.walletconnect.com/2.0/web/web3modal/react/wagmi/custom-wallets#custom-explorer-wallets - Metamask, Rainbow and TrustWallet
          explorerRecommendedWalletIds: [
            'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96',
            '1ae92b26df02f0abca6304df07debccd18262fdf5fe82daa81593582dac9a369',
            '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0'
          ]
        }
      }
    }),
    new CoinbaseWalletConnector({
      chains,
      options: {
        appName: 'Polychainmonsters'
      }
    }),
    new InjectedConnector({
      chains,
      options: {
        name: 'Injected',
        shimDisconnect: true
      }
    })
  ],
  publicClient
});

export function Web3Provider({ children }: Web3ProviderTypes) {
  return (
    <WagmiConfig config={config}>
      <SolanaWalletProvider>{children}</SolanaWalletProvider>
    </WagmiConfig>
  );
}
