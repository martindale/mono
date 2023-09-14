const webdriver = require('selenium-webdriver')
const chrome = require('selenium-webdriver/chrome.js')

const options = new chrome.Options()
options.setLoggingPrefs({
  browser: 'ALL'
})
options.addArguments('--enable-logging')
options.addArguments('--log-level=0')
options.addArguments('--user-data-dir=/Users/dev/Library/Application\ Support/Google/Chrome')
options.addArguments('--profile-directory=Profile 1')

const By = webdriver.By
const driver = new webdriver.Builder().forBrowser('chrome').setChromeOptions(options).build()

const wait = (t) => {
  return new Promise((res, rej) => {
    setTimeout(res, t)
  })
}

async function main () {
  await driver.navigate().to('http://localhost:5173')

  const res = await driver.findElement(By.className('connect-bitcoin'))
  await res.click()

  const connectLightning = await driver.findElement(By.id('connect-l1'))
  await connectLightning.click()
  await wait(500)
  await driver.switchTo().alert().sendKeys('2')
  await driver.switchTo().alert().accept()

  await wait(2000)

  let windows = await driver.getAllWindowHandles()
  await driver.switchTo().window(windows[1]) // assuming the extension popup is the second window

  // Unisat control
  const pwdInput = await driver.findElement(By.tagName('input'))
  await pwdInput.sendKeys('TESTPW123')

  const loginBtn = await driver.findElement(By.className('sc-jxOSlx'))
  await loginBtn.click()

  await wait(15000)

  windows = await driver.getAllWindowHandles()
  if (windows.length === 1) {
    console.log('Xverse Wallet Connected!')
  } else {
    await driver.switchTo().window(windows[1]) // assuming the extension popup is the second window

    const approveBtn = await driver.findElement(By.className('iwDLzk'))
    await approveBtn.click()
    console.log('Xverse Wallet Connected!')

    await wait(1000)
  }

  await driver.switchTo().window(windows[0])

  const modal = await driver.findElement(By.className('connect-modal-color'))
  const simulate = await modal.findElement(By.className('simulate-l1'))
  await simulate.click()

  await wait(3000)

  windows = await driver.getAllWindowHandles()
  await driver.switchTo().window(windows[1]) // assuming the extension popup is the second window

  try {
    const logs = await driver.manage().logs().get('browser')
    const idxLog = logs.findIndex(log => log.message.indexOf('Xverse Wallet Connected') >= 0)
    if (idxLog >= 0) {
      console.log('Address Detected')
      console.log(logs[idxLog].message)
    }
  } catch (e) {

  }

  try {
    const approveBtn = await driver.findElement(By.className('iwDLzk'))
    const text = await approveBtn.getText()
    if (text.indexOf('Close') === -1) {
      await approveBtn.click()
    } else {
      await approveBtn.click()
      throw new Error('Insufficient Balance!')
    }
    console.log('Payment Simulation Done!')
  } catch (e) {
    console.error('Error occured on payment!')
  }
}

main()
