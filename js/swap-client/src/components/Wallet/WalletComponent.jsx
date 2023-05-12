import React, { useEffect } from 'react';
import {
  Button, 
  Divider, 
  Form, 
  Grid,
  Modal,
  TextArea,
} from 'semantic-ui-react';
import { WalletItem } from './WalletItem';
import styles from '../styles/wallet/WalletComponent.module.css';
import { useState } from 'react';
import { setNodeData, setWalletData, clearNodeData, clearWalletData } from '../../slices/walletSlice';
import { signIn, signOut } from '../../slices/userSlice.js';
import { useAppDispatch, useAppSelector } from "../../hooks.js";
import Client from '../../utils/client';


export const WalletComponent = () => {
  const dispatch = useAppDispatch();
  const [nodeModalOpen, setNodeModalOpen] = useState(false);
  const [nodeInput, setNodeInput] = useState(false);
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [walletInput, setWalletInput] = useState(false);
  
  const node = useAppSelector(state => state.wallet.node);
  const wallet = useAppSelector(state => state.wallet.wallet);
  const user = useAppSelector(state => state.user);

  useEffect(() => {
    // console.log("node or wallet updated")
    // console.log({wallet})
    if (node.connected) {
      setNodeModalOpen(false);
    }
    if (wallet.connected) {
      setWalletModalOpen(false);
    }

    if (node.connected && wallet.connected && user.user.id==undefined) {
      const hostname = window.location.hostname;
      const port = window.location.port;
      dispatch(signIn(new Client({ id: 'unnamed', hostname, port, credentials: Object.assign(nodeInput,walletInput) })));
    }
    else if (!node.connected && !wallet.connected) {
      dispatch(signOut());
    }

  }, [node, wallet]);

  useEffect(() => {
    if (!user.isLoggedIn) {
      clearNodeData()
      clearWalletData()
    }
  }, [user.isLoggedIn]);

  const onConnectNode = (data = null) => {
    dispatch(setNodeData(data || {
      'lightning': {
      'admin': '',
      'invoice': '',
      'socket': '',
      'cert': '',
    }}));
    setNodeModalOpen(false);
  }
  const onConnectWallet = (data) => {
    // TODO add public key derivation from private key
    dispatch(setWalletData(data || '0xab5801a7d398351b8be11c439e05c5b3259aec9b'));
    setWalletModalOpen(false);
  }

  return (
    <>
      <Grid className={styles.walletContainer}>
        <Grid.Row className={styles.walletHeader}>
        <h3>Funds</h3>
        </Grid.Row>
        <WalletItem type='bitcoin' item={node} onConnect={() => setNodeModalOpen(true)} />
        <Divider />
        <WalletItem type='ethereum' item={wallet} onConnect={() => setWalletModalOpen(true)} />
      </Grid>
      <Modal
        basic
        closeIcon
        dimmer={'blurring'}
        open={nodeModalOpen}
        onOpen={() => setNodeModalOpen(true)}
        onClose={() => setNodeModalOpen(false)}
        className={styles.connectModal}
      >
        <Modal.Header><img className="ui avatar image" src="https://github.com/dapphub/trustwallet-assets/blob/master/blockchains/bitcoin/info/logo.png?raw=true" />&nbsp;Bitcoin</Modal.Header>
        <Modal.Content className='pb-1 pt-1'>
          <Form className={styles.connectForm}>
            <Form.Field>
              <label>Lightning Network Client Info</label>
              <TextArea onChange={e => {setNodeInput(e.target.value)}} placeholder="{
                'lightning': {
                'admin': ',
                'invoice': ',
                'socket': ',
                'cert': ',
                }'" />
            </Form.Field>
          </Form>
        </Modal.Content>
        <Modal.Actions className='pt-0'>
          <Button circular secondary className='gradient-btn w-100 h-3' onClick={e => onConnectNode(nodeInput)}>Connect Node</Button>
        </Modal.Actions>
      </Modal>
      <Modal
        basic
        closeIcon
        dimmer={'blurring'}
        open={walletModalOpen}
        onOpen={() => setWalletModalOpen(true)}
        onClose={() => setWalletModalOpen(false)}
        className={styles.connectModal}
      >
        <Modal.Header><img className="ui avatar image" src="https://github.com/dapphub/trustwallet-assets/blob/master/blockchains/ethereum/info/logo.png?raw=true" />&nbsp;Ethereum</Modal.Header>
        <Modal.Content className='pb-1 pt-1'>
          <Form className={styles.connectForm}>
            <Form.Field>
              <label>Private Key</label>
              <TextArea onChange={e => {setWalletInput(e.target.value)}} placeholder="0xab5801a7d398351b8be11c439e05c5b3259aec9b" />
            </Form.Field>
          </Form>
        </Modal.Content>
        <Modal.Actions className='pt-0'>
          <Button circular secondary className={styles.gradientBack} onClick={e => onConnectWallet(walletInput)}>Connect Wallet</Button>
        </Modal.Actions>
      </Modal>
    </>
  );
}
