import React, { useCallback, useState, useSyncExternalStore } from 'react'
import { MyModal } from '../MyModal/MyModal'
import { Button, Divider, Grid, IconButton, Input } from '@mui/material'
import { Close, West } from '@mui/icons-material'
import styles from '../../styles/wallet/AddOtherAssetsModal.module.css'
import NavigateNextIcon from '@mui/icons-material/NavigateNext'

/** Assets supported in wallet */
const ASSETS = [{
  title: 'Bitcoin',
  type: 'BTC',
  rate: 100000000,
  connected: false,
  network: 'lightning.btc',
  img_url: 'https://github.com/dapphub/trustwallet-assets/blob/master/blockchains/bitcoin/info/logo.png?raw=true',
  isNFT: false,
  data: null
}, {
  title: 'Æternity',
  type: 'AE',
  rate: 1000000000000000000,
  connected: false,
  network: 'eth-l2.eth',
  img_url: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1700.png',
  isNFT: false,
  data: null,
  balance: 1000
}, {
  title: 'Ethereum',
  type: 'ETH',
  rate: 1000000000000000000,
  connected: false,
  network: 'eth-l2.eth',
  img_url: 'https://github.com/dapphub/trustwallet-assets/blob/master/blockchains/ethereum/info/logo.png?raw=true',
  isNFT: false,
  data: null
}, {
  title: 'Tether',
  type: 'USDT',
  rate: 1000000000000000000,
  connected: false,
  network: 'eth-l2.eth',
  img_url: 'https://seeklogo.com/images/T/tether-usdt-logo-FA55C7F397-seeklogo.com.png',
  isNFT: false,
  data: null,
  balance: 1000
}]

/** Modal for adding additional assets to wallet */
export const AddOtherAssetsModal = ({ open, handleClose }) => {
  const [selectedAsset, setSelectedAsset] = useState(null)
  const [filter, setFilter] = useState('')

  const handleClick = useCallback((asset) => {
    setSelectedAsset(asset)
  }, [])

  const onClose = useCallback(() => {
    setSelectedAsset(null)
    handleClose()
  }, [])

  /** Add selected assets  */
  if (selectedAsset != null) {
    return (
      <MyModal open={open}>
        <Grid container direction='column' spacing={1}>
          <Grid item container direction='row' width={400}>
            <Grid item xs={1}><IconButton onClick={() => setSelectedAsset(null)}><West /></IconButton></Grid>
            <Grid item xs={10} className='flex-center flex-middle'><h3>Add {selectedAsset.title}</h3></Grid>
            <Grid item xs={1} textAlign='right'><IconButton onClick={onClose}><Close /></IconButton></Grid>
          </Grid>
          <Grid item container direction='column' className='flex-middle'>
            <img width={70} src={selectedAsset.img_url} />
            <h3>{selectedAsset.title}</h3>
            <h4 style={{ color: 'grey' }}>on Chain</h4>
          </Grid>
          <Button className='gradient-btn w-100 h-100 p-1 mt-1'>
            Add {selectedAsset.title} To Assets
          </Button>
        </Grid>
      </MyModal>
    )
  }

  /** Add specific assets */
  return (
    <MyModal open={open}>
      <Grid container direction='column' spacing={1}>
        <Grid item container direction='row' width={400}>
          <Grid item xs={1}><IconButton onClick={onClose}><West /></IconButton></Grid>
          <Grid item xs={10} className='flex-center flex-middle'><h3>Add Other Assets</h3></Grid>
          <Grid item xs={1} textAlign='right'><IconButton onClick={onClose}><Close /></IconButton></Grid>
        </Grid>
        <Grid item container direction='column' spacing={1} height={400}>
          <Input className={styles['search-input']} disableUnderline value={filter} onChange={(e) => setFilter(e.target.value)} />
          {ASSETS.filter(asset => asset.title.indexOf(filter) !== -1).map((asset, idx) => <span key={idx}><Grid item container direction='row' onClick={e => handleClick(asset)} style={{ cursor: 'pointer' }}>
            <Grid item xs={1.5}><img width='32px' src={asset.img_url} /></Grid>
            <Grid item container xs={5} direction='column' textAlign='left'>
              <span><h4>{asset.title}</h4></span>
              {asset.type && <span><h5 style={{ fontSize: '0.8em', color: 'grey' }}>{asset.type}</h5></span>}
            </Grid>
            <Grid item xs={5.5} textAlign='right' alignItems='center'>
              <NavigateNextIcon />
            </Grid>
                                                                                                          </Grid><Divider style={{ margin: '0.3em' }} />
                                                                                          </span>)}
          {ASSETS.filter(asset => asset.title.indexOf(filter) !== -1).length === 0 && <span style={{ textAlign: 'center', marginTop: '100px' }}>No results</span>}
        </Grid>
        <Grid item style={{ marginTop: '2em' }}>
          <a onClick={() => setOtherModalOpen(true)} className={styles['request-asset']}>+ Request Other Asset</a>
        </Grid>
      </Grid>
    </MyModal>
  )
}
