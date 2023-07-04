import { jsonRpcProvider } from 'wagmi/providers/jsonRpc';
import { JsonRpcProviderList } from './web3-provider.types';

export function generateJsonRpcProvider(providerList: JsonRpcProviderList) {
  return providerList.map((rpcProvider) =>
    jsonRpcProvider({
      rpc: (rpcChain) => {
        if (rpcChain.id !== rpcProvider.id) {
          return null;
        }
        return { http: rpcProvider.url };
      }
    })
  );
}
