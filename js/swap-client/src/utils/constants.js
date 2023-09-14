import alice from './credentials/alice.json'
import bob from './credentials/bob.json'
/**
 * Fetches the chain information via dapphub github repo
 * @returns {JSON}
 */

export const CHAIN_INFO = {
  BTC: {
    url: 'https://github.com/dapphub/trustwallet-assets/blob/master/blockchains/bitcoin/info/logo.png?raw=true',
    name: 'Bitcoin'
  },
  ETH: {
    url: 'https://github.com/dapphub/trustwallet-assets/blob/master/blockchains/ethereum/info/logo.png?raw=true',
    name: 'Ethereum'
  }
}
export const getAlice = () => {
  return alice
}
export const getBob = () => {
  return bob
}

/**
 * Fetches walletconnect supported wallet info
 * @returns {JSON}
 */

export const WALLETS = [{
  title: 'Rainbow',
  img: 'https://explorer-api.walletconnect.com/v3/logo/lg/7a33d7f1-3d12-4b5c-f3ee-5cd83cb1b500?projectId=2f05ae7f1116030fde2d36508f472bfb'
}, {
  title: 'Uniswap',
  img: 'https://explorer-api.walletconnect.com/v3/logo/lg/32a77b79-ffe8-42c3-61a7-3e02e019ca00?projectId=2f05ae7f1116030fde2d36508f472bfb'
}, {
  title: 'Trust Wallet',
  img: 'https://explorer-api.walletconnect.com/v3/logo/lg/0528ee7e-16d1-4089-21e3-bbfb41933100?projectId=2f05ae7f1116030fde2d36508f472bfb'
}, {
  title: 'Binance',
  img: 'https://explorer-api.walletconnect.com/v3/logo/lg/ebac7b39-688c-41e3-7912-a4fefba74600?projectId=2f05ae7f1116030fde2d36508f472bfb'
}, {
  title: 'Argent',
  img: 'https://explorer-api.walletconnect.com/v3/logo/lg/215158d2-614b-49c9-410f-77aa661c3900?projectId=2f05ae7f1116030fde2d36508f472bfb'
}, {
  title: 'Metamask',
  img: 'https://explorer-api.walletconnect.com/v3/logo/lg/5195e9db-94d8-4579-6f11-ef553be95100?projectId=2f05ae7f1116030fde2d36508f472bfb'
}, {
  title: 'Safe',
  img: 'https://explorer-api.walletconnect.com/v3/logo/lg/a1cb2777-f8f9-49b0-53fd-443d20ee0b00?projectId=2f05ae7f1116030fde2d36508f472bfb'
}, {
  title: 'Gnosis Safe Multising',
  img: 'https://explorer-api.walletconnect.com/v3/logo/lg/0b7e0f05-0a5b-4f3c-315d-59c1c4c22c00?projectId=2f05ae7f1116030fde2d36508f472bfb'
}, {
  title: 'Zapper',
  img: 'https://explorer-api.walletconnect.com/v3/logo/lg/94b7adda-4a61-4895-17a7-1c6023ab4900?projectId=2f05ae7f1116030fde2d36508f472bfb'
}, {
  title: 'im Token',
  img: 'https://explorer-api.walletconnect.com/v3/logo/lg/497781c4-ee1c-4087-c73a-0147b3a8d800?projectId=2f05ae7f1116030fde2d36508f472bfb'
}, {
  title: 'Zerion',
  img: 'https://explorer-api.walletconnect.com/v3/logo/lg/f216b371-96cf-409a-9d88-296392b85800?projectId=2f05ae7f1116030fde2d36508f472bfb'
}, {
  title: 'Coin98',
  img: 'https://explorer-api.walletconnect.com/v3/logo/lg/fc460647-ea95-447a-99f0-1bff8fa4be00?projectId=2f05ae7f1116030fde2d36508f472bfb'
}, {
  title: 'Ledger Wallet',
  img: 'https://explorer-api.walletconnect.com/v3/logo/lg/a7f416de-aa03-4c5e-3280-ab49269aef00?projectId=2f05ae7f1116030fde2d36508f472bfb'
}, {
  title: 'Wallet 3',
  img: 'https://explorer-api.walletconnect.com/v3/logo/lg/34ab7558-9e64-4436-f4e6-9069f2533d00?projectId=2f05ae7f1116030fde2d36508f472bfb'
}, {
  title: 'Exodus',
  img: 'https://explorer-api.walletconnect.com/v3/logo/lg/4c16cad4-cac9-4643-6726-c696efaf5200?projectId=2f05ae7f1116030fde2d36508f472bfb'
}, {
  title: 'Zengo Wallet',
  img: 'https://explorer-api.walletconnect.com/v3/logo/lg/cfc07342-23ea-4f3f-f071-ec9d2cd86b00?projectId=2f05ae7f1116030fde2d36508f472bfb'
}, {
  title: 'AlphaWallet',
  img: 'https://explorer-api.walletconnect.com/v3/logo/lg/5b1cddfb-056e-4e78-029a-54de5d70c500?projectId=2f05ae7f1116030fde2d36508f472bfb'
}, {
  title: 'Math Wallet',
  img: 'https://explorer-api.walletconnect.com/v3/logo/lg/26a8f588-3231-4411-60ce-5bb6b805a700?projectId=2f05ae7f1116030fde2d36508f472bfb'
}, {
  title: 'Ambire Wallet',
  img: 'https://explorer-api.walletconnect.com/v3/logo/lg/c39b3a16-1a38-4588-f089-cb7aeb584700?projectId=2f05ae7f1116030fde2d36508f472bfb'
}, {
  title: 'Infinity Wallet',
  img: 'https://explorer-api.walletconnect.com/v3/logo/lg/9f259366-0bcd-4817-0af9-f78773e41900?projectId=2f05ae7f1116030fde2d36508f472bfb'
}, {
  title: 'Spot Wallet',
  img: 'https://explorer-api.walletconnect.com/v3/logo/lg/1bf33a89-b049-4a1c-d1f6-4dd7419ee400?projectId=2f05ae7f1116030fde2d36508f472bfb'
}, {
  title: '1inch Wallet',
  img: 'https://explorer-api.walletconnect.com/v3/logo/lg/dce1ee99-403f-44a9-9f94-20de30616500?projectId=2f05ae7f1116030fde2d36508f472bfb'
}, {
  title: 'Coinbase Wallet',
  img: 'https://explorer-api.walletconnect.com/v3/logo/lg/a5ebc364-8f91-4200-fcc6-be81310a0000?projectId=2f05ae7f1116030fde2d36508f472bfb'
}]
