const testBTCETH = require('./test2')
const testUnisat = require('./test_unisat')
const testXverse = require('./test_xverse')
const testMetamask = require('./test_metamask')
const testAlby = require('./test_alby')

const main = async () => {
  await testBTCETH()
  await testXverse()
  await testUnisat()
  await testMetamask()
  await testAlby()
}

main()
