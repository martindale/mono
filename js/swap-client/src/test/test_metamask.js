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

  const res = await driver.findElement(By.className('connect-ethereum'))
  await res.click()

  const connectLightning = await driver.findElement(By.id('connect-metamask'))
  await connectLightning.click()

  await wait(2000)

  let windows = await driver.getAllWindowHandles()
  await driver.switchTo().window(windows[1]) // assuming the extension popup is the second window

  // Unisat control
  const pwdInput = await driver.findElement(By.tagName('input'))
  await pwdInput.sendKeys('TESTPW123')

  const buttons = await driver.findElements(By.tagName('button'))
  await buttons[0].click()

  await wait(2000)

  windows = await driver.getAllWindowHandles()
  if (windows.length === 1) {
    console.log('Metamask Wallet Connected!')
  } else {
    await driver.switchTo().window(windows[1]) // assuming the extension popup is the second window

    let footer = await driver.findElement(By.className('page-container__footer'))
    let approveBtn = await footer.findElements(By.tagName('button'))
    await approveBtn[1].click()

    footer = await driver.findElement(By.className('page-container__footer'))
    approveBtn = await footer.findElements(By.tagName('button'))
    await approveBtn[1].click()
    console.log('Metamask Wallet Connected!')

    await wait(1000)
  }

  const logs = await driver.manage().logs().get('browser')
  const idxLog = logs.findIndex(log => log.message.indexOf('Metamask Wallet Connected') >= 0)
  if (idxLog >= 0) {
    console.log('Address Detected')
    console.log(logs[idxLog].message)
  }

  await driver.switchTo().window(windows[0])
}

main()
