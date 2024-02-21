const puppeteer = require('puppeteer')
const path = require('path')
const { Given, When, Then } = require('@cucumber/cucumber')

let browser, projPage

const wait = (t) => {
  return new Promise((res, rej) => {
    setTimeout(res, t)
  })
}

async function runTests () {
  Given('Test Browser is opened - FM', { timeout: 100000 }, async () => {
    await openTestBrowser()
  })
  When('Create MetaMask Wallet - FM', { timeout: 100000 }, async () => {
    await createMetamaskWallet()
  })
  Then('Connect MetaMask Wallet - FM', { timeout: 100000 }, async () => {
    await connectMetamaskWallet()
  })
}

const openTestBrowser = async () => {
  const metamaskPath = path.join(process.cwd(), 'test/ui/crx/metamask')
  browser = await puppeteer.launch({
    headless: 'new',
    // headless: false,
    args: [
      `--disable-extensions-except=${metamaskPath}`,
      `--load-extension=${metamaskPath}`
    ]
  })
  projPage = (await browser.pages())[0]
  await projPage.goto('http://localhost:5173') // Open the Proj
}

const createMetamaskWallet = async () => {
  await wait(3000)

  const metamaskPage = (await browser.pages())[1]
  await (await metamaskPage.$('.check-box')).click() // Checkbox Accept
  await wait(500)
  await (await metamaskPage.$('.btn-primary')).click() // Accept Button
  await wait(500)
  await (await metamaskPage.$('.btn-primary')).click() // Create button
  await wait(500)
  const pwdInputs = await metamaskPage.$$('.form-field__input') // Input Passwords
  await pwdInputs[0].type('TESTPW123_five')
  await pwdInputs[1].type('TESTPW123_five')
  await (await metamaskPage.$('.check-box')).click() // Next
  await wait(500)
  await (await metamaskPage.$('.btn-primary')).click() // Skip the Backup step
  await wait(1000)
  await (await metamaskPage.$('.mm-button-base')).click()
  await wait(500)
  await (await metamaskPage.$('.skip-srp-backup-popover__checkbox')).click()
  await wait(500)
  await (await (await metamaskPage.$('.skip-srp-backup-popover__footer')).$$('button'))[1].click()
  await wait(500)
  await (await metamaskPage.$('.btn-primary')).click() // Next
  await wait(500)
  await (await metamaskPage.$('.btn-primary')).click() // Done
  await wait(500)
  await (await metamaskPage.$('.btn-primary')).click() // Close
  await metamaskPage.close()
}

const connectMetamaskWallet = async () => {
  await (await projPage.$('.connect-ethereum')).click()
  await (await projPage.$('#connect-metamask')).click()

  await wait(4000)
  const dlgWindow = (await browser.pages())[1]

  await (await (await dlgWindow.$('.page-container__footer')).$$('button'))[1].click() // Approve Button
  await wait(500)
  await (await (await dlgWindow.$('.page-container__footer')).$$('button'))[1].click() // Approve Button

  console.log('Metamask Wallet Connected!')

  await browser.close()
}

// Execute the tests
runTests().catch(error => {
  console.error('Error during tests:', error)
})
