import { ReactNode } from 'react';

export interface Web3ProviderTypes {
  children: ReactNode;
}

export type JsonRpcProviderList = { id: number; url: string }[];
