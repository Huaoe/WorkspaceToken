'use client'

import { ThemeProvider } from "next-themes"
import '@rainbow-me/rainbowkit/styles.css'
import { getDefaultWallets, RainbowKitProvider } from '@rainbow-me/rainbowkit'
import { configureChains, createConfig, WagmiConfig } from 'wagmi'
import { hardhat, sepolia } from 'wagmi/chains'
import { publicProvider } from 'wagmi/providers/public'

const { chains, publicClient } = configureChains(
  [hardhat, sepolia],
  [publicProvider()]
)

const { connectors } = getDefaultWallets({
  appName: 'Blockchain Real Estate',
  projectId: '635cfa629c7abb470dd55d0939ba38d6', 
  chains
})

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient
})

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiConfig config={wagmiConfig}>
      <RainbowKitProvider chains={chains}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </RainbowKitProvider>
    </WagmiConfig>
  )
}
