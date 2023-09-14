const testBTCETH = require('./test2')
const testUnisat = require('./ntest_unisat')
const testXverse = require('./ntest_xverse')
const testMetamask = require('./ntest_metamask')

const main = async () => {
  await testBTCETH()
  await testXverse()
  await testUnisat()
  await testMetamask()
  // await testAlby();
}

main()
