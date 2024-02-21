import { Grid, Stack } from '@mui/material'
import React from 'react'
import styles from '../../styles/collectibles/index.module.css'

export const NFTCard = ({ card, handleClick }) => {
  return (
    <Grid item xs={3} container direction='column' onClick={e => handleClick(card)}>
      <Stack className={`${styles['nft-card']} nft-card`}>
        <Grid item>
          <img src={card.img_url} width='100%' />
        </Grid>
        <Grid item className='flex-center flex-middle'>
          <h4 className={styles['ordinal-btn']}>
            <img className={styles['btc-logo']} width='20px' src='https://github.com/dapphub/trustwallet-assets/blob/master/blockchains/bitcoin/info/logo.png?raw=true' />Ordinal
          </h4>
        </Grid>
        <Grid item textAlign='center'>
          <h4>{card.info.inscription.slice(0, 7)}</h4>
        </Grid>
      </Stack>
    </Grid>
  )
}
