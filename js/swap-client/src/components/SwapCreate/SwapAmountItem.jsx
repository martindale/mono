import React from 'react';
import { Dropdown, Form } from 'semantic-ui-react';
import styles from '../styles/SwapCreate.module.css';

const friendOptions = [
  {
    key: 'BTC',
    text: 'BTC',
    value: 'BTC',
    image: { avatar: true, src: 'https://github.com/dapphub/trustwallet-assets/blob/master/blockchains/bitcoin/info/logo.png?raw=true' },
  },
  {
    key: 'ETH',
    text: 'ETH',
    value: 'ETH',
    image: { avatar: true, src: 'https://github.com/dapphub/trustwallet-assets/blob/master/blockchains/ethereum/info/logo.png?raw=true' },
  }
]

export const SwapAmountItem = ({coinType, amount, className, onAmountChange, unitPrice, onCoinTypeChange, limitOrder = true}) => {
  const links = {
    'btc': "https://github.com/dapphub/trustwallet-assets/blob/master/blockchains/bitcoin/info/logo.png?raw=true",
    'eth': "https://github.com/dapphub/trustwallet-assets/blob/master/blockchains/ethereum/info/logo.png?raw=true"
  };

  return <Form.Group widths='equal' className={className}>
    <Form.Field className={styles.swapAmountInput}>
      { limitOrder ? 
          <input className={styles.swapInput} type='number' value={(amount===0)?'':amount} onChange={onAmountChange}/>
        :
          <input className={styles.swapInput} type='number' value={(amount===0)?'':amount} onChange={onAmountChange}/>
      }
      { unitPrice * amount > 0 ? <p className={styles.price}>${unitPrice * amount}</p> : ''}
    </Form.Field>
    <Form.Field className={styles.coinType}>
      <Dropdown
        className={styles.swapCoinSelect}
        floating
        fluid
        labeled
        button
        value={coinType}
        options={friendOptions}
        onChange={onCoinTypeChange}
      />
    </Form.Field>
  </Form.Group>
};