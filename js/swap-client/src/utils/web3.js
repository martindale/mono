import Web3 from 'web3'
const web3 = new Web3(Web3.givenProvider)

export const getEthAddress = async () => {
  return await window.ethereum.request({ method: 'eth_requestAccounts' })
}

export const getEthBalance = async (addr) => {
  return await web3.eth.getBalance(addr)
}
