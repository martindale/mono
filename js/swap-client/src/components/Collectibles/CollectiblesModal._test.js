import { CollectiblesModal } from './CollectiblesModal'
import { create, act } from 'react-test-renderer'
import configureStore from 'redux-mock-store'
import { Provider } from 'react-redux'

describe('AccountSelector', () => {
  const initialState = {
    wallet: {
      assets: [
        {
          title: 'Bitcoin',
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
          network: 'eth-l2.eth',
          img_url: 'https://github.com/dapphub/trustwallet-assets/blob/master/blockchains/ethereum/info/logo.png?raw=true',
          isNFT: false,
          data: null
        }
      ]
    }
  }
  const mockStore = configureStore()
  let store
  const handleClose = jest.fn()
  it('should work', () => {
    let tree
    act(() => {
      store = mockStore(initialState)
      tree = create(
        <Provider store={store}>
          <CollectiblesModal
            open
            handleClose={handleClose}
          />
        </Provider>
      )
    })

    expect(tree).toMatchSnapshot()
  })
  afterAll(() => jest.resetModules())
})
