const puppeteer = require('puppeteer')
const path = require('path')
const { Given, When, Then } = require('@cucumber/cucumber')

const wait = (t) => {
  return new Promise((res, rej) => {
    setTimeout(res, t)
  })
}

let browser, projPage, emailPage, newAlbyDlg, newAlbyPage

async function runTests () {
  Given('Test Browser is opened - FA', { timeout: 50000 }, async () => {
    await openTestBrowser()
  })

  When('New Alby wallet extension page is opened - FA', { timeout: 150000 }, async () => {
    await newAlbyWalletPageOpen()
  })

  When('Temp Mail page is opened and sign up with email - FA', { timeout: 150000 }, async () => {
    await tempMailPageManage()
  })

  Then('Input Code sent to inbox - FA', { timeout: 100000 }, async () => {
    await codeSentToInbox()
  })

  Then('Connect Alby Wallet and simulate payment - FA', { timeout: 100000 }, async () => {
    await connectWalletAndSimulate()
  })
}

const openTestBrowser = async () => {
  const unisatExtPath = path.join(process.cwd(), 'test/ui/crx/alby')

  browser = await puppeteer.launch({
    headless: 'new',
    // headless: false,
    args: [
      `--disable-extensions-except=${unisatExtPath}`,
      `--load-extension=${unisatExtPath}`
    ]
  })
  projPage = (await browser.pages())[0]
  await projPage.goto('http://localhost:5173', { timeout: 100000 }) // Open the Proj

  projPage.on('dialog', async dialog => { // Handle Accept on Wallet Select Prompt
    await dialog.accept('1')
  })

  await wait(3000)
}

const newAlbyWalletPageOpen = async () => {
  newAlbyPage = (await browser.pages())[1]
  const inputs = (await newAlbyPage.$$('input'))
  await inputs[0].type('TESTPW123_five')
  await inputs[1].type('TESTPW123_five')

  await (await newAlbyPage.$('.bg-primary-gradient')).click()
  await wait(500)
  await (await newAlbyPage.$('.bg-primary-gradient')).click()
  await wait(10000)

  while (1) {
    const len = (await browser.pages()).length
    if (len > 2) break
    await wait(3000)
  }
}

const tempMailPageManage = async () => {
  // Open Temp Mail Page
  emailPage = await browser.newPage()
  await emailPage.goto('https://internxt.com/temporary-email')
  await wait(5000)
  const email = await emailPage.$eval('.px-4.py-3 p', el => el.innerHTML)

  await wait(1000)

  newAlbyDlg = (await browser.pages())[2]
  await (await newAlbyDlg.$$('.bg-primary-gradient'))[1].click()
  await wait(2000)
  await (await newAlbyDlg.$('.w-full.rounded-md.px-3.py-2.border-1.border-border-secondary')).type(email)
  await (await newAlbyDlg.$('.px-7.py-2.rounded-md')).click()
}

const codeSentToInbox = async () => {
  /** Click Refresh Button to reload the incoming emails */
  await wait(10000)
  await (await emailPage.$('.cursor-pointer.text-gray-50')).click()

  await emailPage.waitForSelector('button.px-4.text-start', { visible: true, timeout: 100000 })
  await (await emailPage.$('button.px-4.text-start')).click()
  await wait(2000)
  let code = await emailPage.$eval('.monospace.otp', el => el.innerHTML)
  code = code.substring(0, 3) + code.substring(code.length - 3)
  console.log(code)

  /** Type One-time Code into the SignUp Page */
  await (await newAlbyDlg.$('.px-3.py-2.border-1.border-border-secondary')).type(code)
  await (await newAlbyDlg.$('.px-7.py-2.rounded-md')).click()
  /** Alby Wallet Extension Created */

  await wait(3000)

  await (await browser.pages())[1].close()
  await wait(1000)
  await (await browser.pages())[1].close()
}

const connectWalletAndSimulate = async () => {
  /** Alby Wallet Connect */
  await (await projPage.$('.connect-bitcoin')).click()
  await (await projPage.$('#connect-lightning')).click()

  /** Click Approve Button */
  await wait(1000)
  const albyConnectDlg = await (await browser.pages())[1]
  await (await albyConnectDlg.$('button.px-0.py-2.bg-primary-gradient')).click()

  /** Simulate Payment */
  await wait(1000)
  await (await projPage.$('#simulate-lightning')).click()
  await wait(1000)
  const albySimulateDlg = await (await browser.pages())[1]
  await (await albySimulateDlg.$('button.px-0.py-2.bg-primary-gradient')).click()
  await wait(1000)
  await (await albySimulateDlg.$('button.px-0.py-2.bg-primary-gradient')).click()

  await wait(2000)

  await browser.close()
}

// Execute the tests
runTests().catch(error => {
  console.error('Error during tests:', error)
})
