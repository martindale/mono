import { ActivityItem } from './ActivityItem'
import { create, act } from 'react-test-renderer'
import configureStore from 'redux-mock-store'
import { Provider } from 'react-redux'

describe('AccessOptionComponent', () => {
  const initialState = {
  }
  const mockStore = configureStore()
  let store
  it('should work', () => {
    let tree
    const activity = {
      hash: '',
      baseAsset: 'BTC',
      baseQuantity: 0,
      createdDate: {
        year: 2000,
        month: 1,
        day: 1
      },
      status: 0,
      quoteAsset: 'ETH',
      quoteQuantity: 0
    }
    const handleClick = jest.fn()

    act(() => {
      store = mockStore(initialState)
      tree = create(
        <Provider store={store}>
          <ActivityItem
            activity={activity}
            index={0}
            handleClick={handleClick}
          />
        </Provider>
      )
    })

    expect(tree).toMatchSnapshot()
  })
  afterAll(() => jest.resetModules())
})
