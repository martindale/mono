import React from 'react'
import { Button } from '@mui/material'

export const DemoSwap = ({ mockSwap }) => {
  return (
    <>
      <p>Demo Swap</p>
      <Button
        circular='true' secondary='true' className='gradient-btn w-100 h-3' onClick={e => mockSwap({
          side: 'ask',
          baseAsset: 'BTC',
          baseNetwork: 'lightning.btc',
          baseQuantity: 0.001,
          quoteAsset: 'ETH',
          quoteNetwork: 'ethereum',
          quoteQuantity: 0.0000000000001
        })}
      >Swap 0.001 BTC for 0.0000000000001 ETH
      </Button>
      <Button
        circular='true' secondary='true' className='gradient-btn w-100 h-3' onClick={e => mockSwap({
          side: 'bid',
          baseAsset: 'ETH',
          baseNetwork: 'ethereum',
          baseQuantity: 0.0000000000001,
          quoteAsset: 'BTC',
          quoteNetwork: 'lightning.btc',
          quoteQuantity: 0.001
        })}
      >Swap 0.0000000000001 ETH for 0.001 BTC
      </Button>
    </>
  )
}
