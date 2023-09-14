import { INSCRIPTIONS } from '../config/inscription_info'

const initialAssets = [{
  title: 'Bitcoin-Taproot',
  type: 'BTC',
  rate: 100000000,
  connected: false,
  network: 'lightning.btc',
  img_url: 'https://github.com/dapphub/trustwallet-assets/blob/master/blockchains/bitcoin/info/logo.png?raw=true',
  isNFT: false,
  data: null,
  options: []
}, {
  title: 'Ethereum',
  type: 'ETH',
  rate: 1000000000000000000,
  connected: false,
  network: 'ethereum',
  img_url: 'https://github.com/dapphub/trustwallet-assets/blob/master/blockchains/ethereum/info/logo.png?raw=true',
  isNFT: false,
  data: null
}, {
  title: 'Bitcoin-lightning',
  type: 'BTC',
  rate: 100000000,
  connected: false,
  network: 'lightning.btc',
  img_url: 'https://github.com/dapphub/trustwallet-assets/blob/master/blockchains/bitcoin/info/logo.png?raw=true',
  isNFT: false,
  data: null,
  options: [],
  isSubNet: true
}, {
  title: 'Tether',
  type: 'USDT',
  rate: 1000000000000000000,
  connected: false,
  network: 'eth-l2.eth',
  img_url: 'https://seeklogo.com/images/T/tether-usdt-logo-FA55C7F397-seeklogo.com.png',
  isNFT: false,
  data: null,
  balance: 1000,
  options: [{
    type: 'paddingAmount',
    title: 'Padding Amount',
    value: 4000
  }, {
    type: 'feeAmount',
    title: 'Fee To Pay',
    value: 1000
  }],
  info: {
    inscription: 'e89c85f571f5bc32430270d6fcd65087f68f66e494596889497e12022fd6f49fi0',
    location: 'e89c85f571f5bc32430270d6fcd65087f68f66e494596889497e12022fd6f49f:0:0',
    explorer: 'http://localhost/inscription/e89c85f571f5bc32430270d6fcd65087f68f66e494596889497e12022fd6f49fi0'
  }
}, ...INSCRIPTIONS]

const walletStore = {
  currentState: {
    assets: initialAssets,
    receivingProcess: 0,
    sendingProcess: 0,
    curAdditionalInput: -1,
    useAdditionalInput: true
  },
  listeners: [],
  reducer (action) {
    const newState = { ...walletStore.currentState }
    switch (action.type) {
      case 'SET_NODE_DATA':
        newState.assets[0].connected = true
        newState.assets[0].data = action.payload
        return newState
      case 'SET_WALLET_DATA':
        newState.assets[1].connected = true
        newState.assets[1].data = action.payload
        return newState
      case 'SET_LIGHTNING_DATA':
        newState.assets[2].connected = true
        newState.assets[2].data = action.payload
        return newState
      case 'SET_NODE_BALANCE':
        newState.assets[0].balance = action.payload
        return newState
      case 'SET_LIGHTNING_BALANCE':
        newState.assets[2].balance = action.payload
        return newState
      case 'SET_WALLET_BALANCE':
        newState.assets[1].balance = action.payload
        return newState
      case 'ADD_NODE_BALANCE':
        newState.assets[0].balance += action.payload
        return newState
      case 'ADD_WALLET_BALANCE':
        newState.assets[1].balance += action.payload
        return newState
      case 'SET_NFT_BALANCE':
        newState.assets.find(asset => asset.type === action.payload.type).balance = action.payload.balance
        return newState
      case 'ADD_NFT_BALANCE':
        newState.assets.find(asset => asset.type === action.payload.type).balance += action.payload.balance
        return newState
      case 'REMOVE_BALANCE_ON_SWAP_ORDER':
        const asset = action.payload.asset; const qty = action.payload.qty
        if (asset < 2) newState.assets[asset].balance -= qty
        else newState.assets[asset].balance = 0
        return newState
      case 'CLEAR_NODE_DATA':
        newState.assets[0].connected = false
        newState.assets[0].balance = 0
        newState.assets[0].data = null
        return newState
      case 'CLEAR_WALLET_DATA':
        newState.assets[1].connected = false
        newState.assets[1].balance = 0
        newState.assets[1].data = null
        return newState
      case 'SET_RECEIVING_PROCESS':
        newState.receivingProcess = action.payload
        return newState
      case 'SET_SENDING_PROCESS':
        newState.sendingProcess = action.payload
        return newState
      case 'SET_USE_ADDITIONAL_INPUT':
        newState.useAdditionalInput = action.payload
        return newState
      case 'SET_ADDITIONAL_INPUT_DATA':
        newState.assets.find(asset => asset.type === action.payload.type).options.find(option => option.type === action.payload.option_type).value = action.payload.value
        return newState
      default:
        return walletStore.currentState
    }
  },
  subscribe (l) {
    walletStore.listeners.push(l)
  },
  getSnapshot () {
    return walletStore.currentState
  },
  dispatch (action) {
    walletStore.currentState = walletStore.reducer(action)
    walletStore.listeners.forEach((l) => l())
    return action
  }
}

export { walletStore }
