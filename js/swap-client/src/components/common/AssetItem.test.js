import { AssetItem } from './AssetItem'
import { create, act } from 'react-test-renderer'

describe('AccessOptionComponent', () => {
  it('should work', () => {
    let tree
    const asset = {
      img_url: '123',
      title: 'card',
      type: '123',
      amount: 1
    }
    const handleClick = jest.fn()

    act(() => {
      tree = create(
        <AssetItem
          asset={asset}
          handleClick={handleClick}
        />
      )
    })

    expect(tree).toMatchSnapshot()
  })
  afterAll(() => jest.resetModules())
})
