import React, { useCallback, useState } from 'react'
import { Button, Divider, Grid, IconButton, Input, Stack } from '@mui/material'
import { MyModal } from '../MyModal/MyModal'
import { Close, West } from '@mui/icons-material'
import { WALLETS } from '../../utils/constants'

/** WalletConnect setup modal */
export const WalletConnectModal = ({ open, handleClose }) => {
  const [page, setPage] = useState(0)
  const [nextStep, setNextStep] = useState(false)

  const onWalletTypeClicked = useCallback(() => {
    setNextStep(true)
  }, [])

  if (nextStep === true) {
    return (
      <MyModal open={open}>
        <Grid container direction='column' spacing={1}>
          <Grid item container direction='row' className='mb-1'>
            <Grid item xs={1}><IconButton onClick={() => setNextStep(false)}><West /></IconButton></Grid>
            <Grid item xs={10} className='flex-center flex-middle'><h3>Mnemonic Or Private Key</h3></Grid>
            <Grid item xs={1} textAlign='right'><IconButton onClick={handleClose}><Close /></IconButton></Grid>
          </Grid>
          <Grid item container direction='row' width={400} rowSpacing={2}>
            <h5>Restore an exsiting wallet with your 12 or 24 mnemonic words or your private key.</h5>
            <textarea style={{ border: '1px solid grey', width: '100%', height: '100px' }} />
          </Grid>
          <Grid item>
            <Button className='gradient-btn w-100 h-100 p-1 mt-1' onClick={handleClose}>
              Connect Wallet
            </Button>
          </Grid>
        </Grid>
      </MyModal>
    )
  }

  return (
    <MyModal open={open}>
      <Grid container direction='column' spacing={1}>
        <Grid item container direction='row'>
          <Grid item xs={1} />
          <Grid item xs={10} className='flex-center flex-middle'><h3>WalletConnect</h3></Grid>
          <Grid item xs={1} textAlign='right'><IconButton onClick={handleClose}><Close /></IconButton></Grid>
        </Grid>
        <Grid item container direction='row' width={400} rowSpacing={2}>
          {
            WALLETS.slice(page * 12, (page + 1) * 12).map((wallet, idx) => (
              <Grid key={idx} item xs={3} container direction='column' className='flex-middle' onClick={() => onWalletTypeClicked(true)}>
                <img width={70} src={wallet.img} style={{ borderRadius: '0.5em' }} />
                <h5>{wallet.title}</h5>
              </Grid>
            ))
          }
        </Grid>
        <Grid item className='flex-center'>
          <Stack direction='row' spacing={1}>
            {Array.from(Array(Math.ceil(WALLETS.length / 12)).keys()).map((num, idx) => <a key={idx} onClick={() => setPage(num)}>{num + 1}</a>)}
          </Stack>
        </Grid>
      </Grid>
    </MyModal>
  )
}
