import React from 'react'
import { Grid, Button, Stack } from '@mui/material'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'

const ID_ARR = { 'Bitcoin-Taproot': 0, Ethereum: 1, 'Bitcoin-lightning': 2 }

export const WalletItem = ({ item, setNodeModalOpen, setWalletModalOpen }) => {
  const type = item.title; const typeId = ID_ARR[type]
  const onClick = [setNodeModalOpen, setWalletModalOpen][typeId]

  return (
    <Grid container direction='row' spacing={1}>
      <Grid item xs={1} textAlign='left'>
        <img width={32} className='ui avatar image' src={item.img_url} />
      </Grid>
      <Grid item xs={5} textAlign='left'>
        <Stack direction='column'>
          <b>{type.indexOf('Bitcoin') >= 0 ? 'Bitcoin' : type}</b>
          <span style={{ fontSize: '0.8em', color: 'grey', marginTop: '-5px' }}>{item.type}</span>
        </Stack>
      </Grid>
      <Grid item xs={6} textAlign='right'>
        {(!item.connected && typeId >= 0)
          ? <Button className={`gradient-btn connect-${['bitcoin', 'ethereum'][typeId]}`} onClick={e => onClick()}>{['Connect Networks', 'Connect Wallet'][typeId]}</Button>
          : <h4 style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
            {typeId === 0 && <Button className='gradient-btn' onClick={() => onClick()} variant='contained'>Connect</Button>}
            <b>{Number(Number(item.balance).toFixed(15))}</b>
            <span style={{ fontSize: '0.8em', color: 'grey', margin: '0 0.1em' }}>{item.type}</span>
            <ChevronRightIcon />
          </h4>}
      </Grid>
    </Grid>
  )
}
