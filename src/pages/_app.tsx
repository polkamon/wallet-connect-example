import type { AppProps } from 'next/app'
import NextHead from 'next/head'
import * as React from 'react'
import {Web3Provider} from "../providers/web3-provider";

function App({ Component, pageProps }: AppProps) {
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])
  return (
      <Web3Provider>
          <NextHead>
            <title>wagmi</title>
          </NextHead>
          {mounted && <Component {...pageProps} />}
      </Web3Provider>
  )
}

export default App
