export const getAvailableNFTCount = (wallet) => {
  let nftCount = 0
  wallet.assets.forEach(asset => {
    if (asset.isNFT && asset.balance > 0) nftCount++
  })
  return nftCount
}

export const getMinimizedAssets = (wallet) => {
  let nftCount = 0
  wallet.assets.forEach(asset => {
    if (asset.isNFT && asset.balance > 0) nftCount++
  })

  const arr = []; const assets = wallet.assets
  assets.forEach(asset => {
    if (asset.isNFT === false) {
      arr.push({
        title: asset.title,
        type: asset.type,
        amount: 0.53,
        isNFT: false,
        img_url: asset.img_url,
        rate: asset.rate
      })
    }
  })
  arr.push({
    title: 'Collectibles',
    type: null,
    amount: nftCount,
    isNFT: true,
    img_url: '/public/nft/1.png',
    rate: 1
  })
  return arr
}

export const getCurAdditionalInputOptions = (wallet) => {
  if (wallet.curAdditionalInput !== -1) return wallet.assets[wallet.curAdditionalInput].options
  return []
}

export const getCurAdditionalInputCoinTitle = (wallet) => {
  if (wallet.curAdditionalInput !== -1) return wallet.assets[wallet.curAdditionalInput].title
  return []
}
