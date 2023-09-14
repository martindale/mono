import React, { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import { Button, Divider, Grid, Stack, IconButton, CircularProgress } from '@mui/material'
import styles from '../../styles/wallet/SendFunds.module.css'
import { validateInvoiceAddress } from '../../utils/helpers'
import { MyModal } from '../MyModal/MyModal'
import { Close, West } from '@mui/icons-material'
import classNames from 'classnames'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import { getMinimizedAssets } from '../../selector'
import { AssetItem } from '../common/AssetItem'
import { CollectiblesModal } from '../Collectibles/CollectiblesModal'
import { AddOtherAssetsModal } from './AddOtherAssetsModal'
import { walletStore } from '../../syncstore/walletstore'

/** SendFunds Modal */
export const SendFunds = () => {
  const [modalOpen, setModalOpen] = useState(false)
  const [recipAddr, setRecipAddr] = useState('')
  const globalWallet = useSyncExternalStore(walletStore.subscribe, () => walletStore.currentState)
  const sendingProcess = globalWallet.sendingProcess
  const assetTypes = getMinimizedAssets(globalWallet)
  const [selAsset, setSelAsset] = useState(null)
  const [otherModalOpen, setOtherModalOpen] = useState(false)

  useEffect(() => {
    if (sendingProcess === 1) setModalOpen(true)
    if (sendingProcess === 4) {
      setTimeout(() => {
        walletStore.dispatch({ type: 'SET_SENDING_PROCESS', payload: 5 })
      }, 1000)
    }
  }, [sendingProcess])

  /** Click on Asset Item */
  const onClickAsset = useCallback((asset) => {
    if (!asset.isNFT) setSelAsset(asset)
    walletStore.dispatch({ type: 'SET_SENDING_PROCESS', payload: !asset.isNFT ? 2 : 1.5 })
  }, [walletStore])

  const onComplete = useCallback(() => {
    walletStore.dispatch({ type: 'SET_SENDING_PROCESS', payload: 0 })
    setModalOpen(false)
  }, [walletStore])

  /** Click on Close */
  const onClickClose = useCallback(() => {
    setModalOpen(false)
    walletStore.dispatch({ type: 'SET_SENDING_PROCESS', payload: 0 })
  }, [walletStore])

  /** Click on Ordinal */
  const onNftItemClick = useCallback((asset) => {
    setSelAsset(asset)
    walletStore.dispatch({ type: 'SET_SENDING_PROCESS', payload: 2 })
  }, [walletStore])

  /** Draw an NFT Asset Container */
  const nftAssetContainer = () => {
    return (
      <Grid item className='flex-center' style={{ border: '1px solid #444444', padding: '0.5em', borderRadius: '0.5em' }}>
        <Stack direction='row' className='flex-middle' spacing={1}>
          <img width={60} src={selAsset.img_url} style={{ borderRadius: '0.5em' }} />
          <Stack direction='column' spacing={1}>
            <h4>{selAsset.type}</h4>
            <h4>{selAsset.title}</h4>
          </Stack>
        </Stack>
      </Grid>
    )
  }

  if (sendingProcess === 1) {
    return (
      <MyModal open={modalOpen}>
        <Grid container direction='column' spacing={1}>
          <Grid item container direction='row'>
            <Grid item xs={1} textAlign='center'>
              <IconButton><West /></IconButton>
            </Grid>
            <Grid item xs={10} textAlign='center' width={sendingProcess < 3 ? 250 : 350}>
              <h3>{sendingProcess === 1 ? 'Select Asset' : 'Receive'}</h3>
            </Grid>
            <Grid item xs={1} textAlign='center'>
              <IconButton onClick={onClickClose}><Close /></IconButton>
            </Grid>
          </Grid>
          {
            assetTypes.map((asset, idx) => <span key={idx}><AssetItem asset={asset} handleClick={onClickAsset} /><Divider style={{ borderColor: '#3A3A3A', margin: '0.3em' }} /></span>)
          }
          <a onClick={() => setOtherModalOpen(true)} style={{ cursor: 'pointer' }}>+ Add Other Asset</a>
        </Grid>
        <AddOtherAssetsModal open={otherModalOpen} handleClose={() => setOtherModalOpen(false)} />
      </MyModal>
    )
  }

  if (sendingProcess === 2) {
    return (
      <MyModal open={modalOpen}>
        <Grid container direction='column' rowSpacing={1}>
          <Grid item container direction='row'>
            <Grid item xs={1} textAlign='center'>
              <IconButton onClick={() => walletStore.dispatch({ type: 'SET_SENDING_PROCESS', payload: 1 })}><West /></IconButton>
            </Grid>
            <Grid item xs={10} textAlign='center' width={sendingProcess < 3 ? 250 : 350}>
              <h3>{sendingProcess === 1 ? 'Select Asset' : 'Send'}</h3>
            </Grid>
            <Grid item xs={1} textAlign='center'>
              <IconButton onClick={onClickClose}><Close /></IconButton>
            </Grid>
          </Grid>
          {selAsset.isNFT && nftAssetContainer()}
          <Grid item>
            <h3>Set Recipient Payment Invoice</h3>
          </Grid>
          <Grid item>
            <input className={styles['recipient-addr']} placeholder='Enter Address' value={recipAddr} onChange={(e) => setRecipAddr(e.target.value)} autoFocus />
          </Grid>
          <Grid item>
            <Button
              className={classNames(
              `w-100 p-1 ${styles['addr-btn']}`,
              {
                'gradient-btn': validateInvoiceAddress(recipAddr),
                'gradient-btn-disabled': !validateInvoiceAddress(recipAddr)
              }
              )}
              disabled={!validateInvoiceAddress(recipAddr)}
              onClick={() => walletStore.dispatch({ type: 'SET_SENDING_PROCESS', payload: 0 })}
            >
              {recipAddr.length === 0
                ? 'Enter a payment invoice'
                : !validateInvoiceAddress(recipAddr)
                    ? 'Enter a supported payment invoice'
                    : 'Continue'}
            </Button>
          </Grid>
        </Grid>
      </MyModal>
    )
  }

  if (sendingProcess === 3 || sendingProcess === 4 || sendingProcess === 5) {
    return (
      <MyModal open={modalOpen}>
        <Grid container direction='column' spacing={2}>
          {sendingProcess !== 4 && <Grid item container direction='row'>
            <Grid item xs={1} textAlign='center'>
              <IconButton><West /></IconButton>
            </Grid>
            <Grid item xs={10} textAlign='center' width={250} />
            <Grid item xs={1} textAlign='center'>
              <IconButton onClick={onClickClose}><Close /></IconButton>
            </Grid>
                                   </Grid>}
          <Grid item textAlign='center' style={{ marginBottom: '1em' }}>
            {sendingProcess === 3
              ? <h3>Review Transaction</h3>
              : sendingProcess === 4
                ? <h3 className='flex-vh-center'><CircularProgress />Sending...</h3>
                : <h3 className='flex-vh-center'><CheckCircleIcon style={{ color: 'green' }} />{selAsset.isNFT ? 'Collectible' : 'Payment'} Sent!</h3>}
          </Grid>
          {selAsset.isNFT
            ? nftAssetContainer()
            : <Grid item container direction='column' className={styles.borderContainer}>
              <Grid item textAlign='center'>0.042 btc</Grid>
              <Grid item textAlign='center'>1,292.00 usd</Grid>
            </Grid>}
          <Grid item container className='space-between'>
            <span>Recipient</span>
            <span>LNBC QWEI DVSA EF#C</span>
          </Grid>
          <Grid item container className='space-between'>
            <span>Network Fees</span>
            <Stack textAlign='right' direction='column'>
              <span>0.0000002btc</span>
              <span>0.00usd</span>
            </Stack>
          </Grid>
          <Grid item container className='space-between'>
            <span>Total</span>
            <Stack textAlign='right' direction='column'>
              <span>0.0000002btc</span>
              <span>0.00usd</span>
            </Stack>
          </Grid>
          <Grid item container direction='row' spacing={2}>
            {sendingProcess == 3 && <><Grid item xs={6}>
              <Button className={`${styles['cancel-btn']} w-100 p-1`} onClick={onClickClose}>
                Cancel
            </Button>
            </Grid>
              <Grid item xs={6}>
                <Button className='gradient-btn w-100 h-100 p-1' onClick={() => walletStore.dispatch({ type: 'SET_SENDING_PROCESS', payload: 4 })}>
               Continue
              </Button>
              </Grid>
            </>}
            {sendingProcess == 4 && <CircularProgress />}
            {sendingProcess == 5 && <Button className='gradient-btn w-100 h-100 p-1' onClick={onClickClose}>
              Close
                                    </Button>}
          </Grid>
        </Grid>
      </MyModal>
    )
  }

  if (sendingProcess === 1.5) { return <CollectiblesModal open={modalOpen} handleClose={onClickClose} handleItemClick={onNftItemClick} /> }
}
