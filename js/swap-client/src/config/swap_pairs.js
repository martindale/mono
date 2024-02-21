export const SWAP_PAIRS = [{
  base: 'BTC',
  quote: 'ETH',
  seeker: 'ETH',
  holder: 'BTC',
  process: [
    1,
    2,
    4,
    5
  ],
  required_chains: [
    'bitcoin',
    'ethereum'
  ]
}, {
  base: 'BTCORD',
  quote: 'BTC',
  seeker: 'BTC',
  holder: 'BTCORD',
  process: [
    1,
    3,
    5
  ],
  required_chains: [
    'bitcoin'
  ]
}]
