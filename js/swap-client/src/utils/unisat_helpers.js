const unisat = window.unisat

/**
 * Fetches the ETH price via coinbase api
 * @param {Object} value the network to switch to
 * @returns {Object} network switched to
 */
export const switchNetwork = async (value) => {
  try {
    const network = await unisat.switchNetwork(value)
    return network
  } catch (e) {

  }
}

/**
 * Sign a psbt
 * @param {Object} psbtHex PSBT hex string to be signed
 * @returns {Object} results of signed output
 */
export const signPsbt = async (psbtHex) => {
  try {
    const psbtResult = await window.unisat.signPsbt(psbtHex)
    setPsbtResult(psbtResult)
  } catch (e) {
    setPsbtResult(e.message)
  }
}

/**
 * Sign a message
 * @param {Object} message to be signed
 * @returns {Object} result of signed message output
 */
export const signMessage = async (message) => {
  const signature = await window.unisat.signMessage(message)
  setSignature(signature)
}

export const pushTxHex = async (txId) => {
  try {
    const txid = await window.unisat.pushTx(rawtx)
    setTxid(txid)
  } catch (e) {
    setTxid(e.message)
  }
}

export const pushPsbtHex = async (psbtHex) => {
  try {
    const txid = await window.unisat.pushPsbt(psbtHex)
    setTxid(txid)
  } catch (e) {
    setTxid(e.message)
  }
}

export const sendBtc = async (addr, sats) => {
  try {
    const txid = await window.unisat.sendBitcoin(
      toAddress,
      satoshis
    )
    setTxid(txid)
  } catch (e) {
    setTxid(e.message)
  }
}
