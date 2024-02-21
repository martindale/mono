import React, { useEffect, useState } from 'react'
import { MyModal } from '../MyModal/MyModal'
import { Button, Divider, Grid, IconButton, Input } from '@mui/material'
import { CheckCircle, Close, West } from '@mui/icons-material'
import { SWAP_STATUS, log } from '../../utils/helpers'
import QRCode from 'qrcode'

export const ActivityDetailModal = ({ open, handleClose, activity }) => {
  const [qrData, setQrData] = useState('')
  const link = 'https://ordinals.com/tx/' + activity.tx

  useEffect(() => {
    if (activity.paymentAddress) {
      log('paymentAddress update', activity.paymentAddress, 'Activity')
      QRCode.toDataURL(activity.paymentAddress)
        .then(url => {
          setQrData(url)
          open = true
        })
        .catch(error => {
          console.log(error)
        })
    }
  }, [activity.paymentAddress, activity.tx])

  return (
    <MyModal open={open}>
      <Grid container direction='column' spacing={1}>
        <Grid item container direction='row' style={{ minWidth: 400 }}>
          <Grid item xs={1}><IconButton onClick={() => setSelectedAsset(null)}><West /></IconButton></Grid>
          <Grid item xs={10} className='flex-center flex-middle'><h3>Activity Details</h3></Grid>
          <Grid item xs={1} textAlign='right'><IconButton onClick={handleClose}><Close /></IconButton></Grid>
        </Grid>
        <Grid item container direction='column' className='flex-middle'>
          {(activity.status === 3) && activity.paymentAddress && <Grid item style={{ marginTop: '0.5em' }} textAlign='center'>
            <Grid item textAlign='center'>Pay to this Address:</Grid>
            <img src={qrData} alt='QrCode' />
            <Divider style={{ marginTop: '1em', border: 0 }} />
            <Grid item textAlign='center'>{activity.paymentAddress}</Grid>
            <Divider style={{ marginTop: '1em', marginBottom: '1em' }} />
                                                                 </Grid>}
          {activity.status == 5 &&
            <p>
              <CheckCircle fontSize='100px' color='success' style={{ color: 'green', fontSize: '60px' }} />
            </p>}
          <Grid item container direction='row'>
            <Grid item xs={5}>Base Asset: </Grid>
            <Grid item xs={3} textAlign='left'>{activity.baseQuantity + ' ' + activity.baseAsset}</Grid>
          </Grid>
          <Grid item container direction='row'>
            <Grid item xs={5}>Quote Asset: </Grid>
            <Grid item xs={3} textAlign='left'>{activity.quoteQuantity + ' ' + activity.quoteAsset}</Grid>
            <Grid item xs={4} textAlign='right' />
          </Grid>
          <Grid container item style={{ textOverflow: 'clip' }}>
            <Grid item xs={5}>Hash:</Grid>
            <Grid item xs={7}>{activity.hash.slice(0, 20) + '...'}</Grid>
          </Grid>
          <Grid container item style={{ textOverflow: 'clip' }}>
            <Grid item xs={5}>Key:</Grid>
            <Grid item xs={7}>{activity.key.slice(0, 15) + '...'}</Grid>
          </Grid>
          <Grid item container direction='row'>
            <Grid item xs={5}>Swap Date: </Grid>
            <Grid item xs={3} textAlign='left'>{activity.createdDate.year + '-' + activity.createdDate.month + '-' + activity.createdDate.day}</Grid>
          </Grid>
          <Grid container item style={{ textOverflow: 'clip' }}>
            <Grid item xs={5}>Status:</Grid>
            <Grid item xs={7}>{SWAP_STATUS[activity.status]}</Grid>
          </Grid>
          {activity.baseInfo && <><Grid container item style={{ textOverflow: 'clip' }}>
            <Grid item xs={5}>Base Inscription:</Grid>
            <Grid item xs={7}>{activity.baseInfo.inscription.slice(0, 15) + '...'}</Grid>
                                  </Grid>
            <Grid container item style={{ textOverflow: 'clip' }}>
              <Grid item xs={5}>Base Location:</Grid>
              <Grid item xs={7}>{activity.baseInfo.location.slice(0, 15) + '...'}</Grid>
            </Grid>
            <Grid container item style={{ textOverflow: 'clip' }}>
              <Grid item xs={5}>Base Explorer:</Grid>
              <Grid item xs={7}>{activity.baseInfo.explorer.slice(0, 15) + '...'}</Grid>
            </Grid>
                                </>}
          {activity.quoteInfo && <><Grid container item style={{ textOverflow: 'clip' }}>
            <Grid item xs={5}>Quote Inscription:</Grid>
            <Grid item xs={7}>{activity.quoteInfo.inscription.slice(0, 15) + '...'}</Grid>
                                   </Grid>
            <Grid container item style={{ textOverflow: 'clip' }}>
              <Grid item xs={5}>Quote Location:</Grid>
              <Grid item xs={7}>{activity.quoteInfo.location.slice(0, 15) + '...'}</Grid>
            </Grid>
            <Grid container item style={{ textOverflow: 'clip' }}>
              <Grid item xs={5}>Quote Explorer:</Grid>
              <Grid item xs={7}>{activity.quoteInfo.explorer.slice(0, 15) + '...'}</Grid>
            </Grid>
                                 </>}
          {activity.status == 5 && activity.tx && <Grid container item style={{ textOverflow: 'clip' }}>
            <a href={link}>{activity.hash.slice(0, 20) + '...'}</a>
                                                  </Grid>}
          {false && activity.status === 1 && <Grid container item style={{ textOverflow: 'clip' }}>
            <Grid item xs={6} textAlign='center'><Button variant='contained' color='error'><b>swap.open</b></Button></Grid>
            <Grid item xs={6} textAlign='center'><Button variant='contained' color='error'><b>swap.commit</b></Button></Grid>
                                             </Grid>}
        </Grid>
        <Button className='gradient-btn w-100 h-100 p-1 mt-1' onClick={handleClose}>
          Close
        </Button>
      </Grid>
    </MyModal>
  )
}
