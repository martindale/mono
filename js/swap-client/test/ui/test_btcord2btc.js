// old test, see site-definition btcord-btc for latests, written in puppeteer

const puppeteer = require('puppeteer')

async function runTests () {
  const aliceSetup = await setupBrowser()
  const bobSetup = await setupBrowser()

  const aliceLogs = []
  const bobLogs = []

  aliceSetup.page.on('console', msg => {
    aliceLogs.push(msg.text())
  })

  bobSetup.page.on('console', msg => {
    bobLogs.push(msg.text())
  })

  await performLogin(aliceSetup.browser, 1)
  await performLogin(bobSetup.browser, 2)

  await createOrder(aliceSetup.browser, 'alice')
  await createOrder(bobSetup.browser, 'bob')

  processLogs(aliceLogs, 'Alice')
  processLogs(bobLogs, 'Bob')

  await finalize()

  await aliceSetup.browser.close()
  await bobSetup.browser.close()
}

function processLogs (logs, identifier) {
  const events = ['order.created', 'order.matched', 'swap.opening', 'swap.opened', 'swap.committing', 'swap.committed']
  console.log(`${identifier}'s logs:`)
  logs.forEach(log => {
    events.forEach(event => {
      if (log.includes(event)) {
        console.log(event)
      }
    })
  })
}

async function setupBrowser () {
  const browser = await puppeteer.launch({ headless: false, args: ['--window-size=1920,1096'] })
  const page = (await browser.pages())[0]
  await page.goto('http://localhost:5173')
  return { browser, page }
}

async function performLogin (browser, index) {
  // Explicitly get the page we want to work with
  const pages = await browser.pages()
  const page = pages[0] // This should be the second tab (index 1)

  // Debugging output
  console.log(`Attempting to login with index: ${index}`)

  await page.waitForSelector('#connect-wallet', { timeout: 10000 }) // Wait up to 1 seconds
  await page.click('#connect-wallet')

  try {
    // Wait for the '.MuiList-root' to be rendered
    await page.waitForSelector('.MuiList-root', { timeout: 5000 }) // waits for 5 seconds
  } catch (error) {
    console.error("Failed to find '.MuiList-root'.", error)
    throw error
  }

  const lis = await page.$$('.MuiList-root li')

  // Ensure the list items are found before trying to click
  if (lis && lis[index]) {
    await lis[index].click()
  } else {
    const error = new Error(`Unable to find list item at index ${index}`)
    console.error(error)
    throw error
  }
}

async function createOrder (browser, identifier) {
  const pages = await browser.pages()
  const page = pages[0] // Get the last page

  if (identifier === 'alice') { // TODO: Remove bob check and manually choose opposite pairs (remove state)
    await page.waitForTimeout(500)
    await (await page.$('.coin-select')).click()

    await page.waitForTimeout(500)
    await (await (await page.$('.modal-container')).$$('.asset-item'))[4].click()

    await page.waitForTimeout(1500)
    await (await (await page.$('.modal-container')).$$('.nft-card'))[0].click()

    await (await page.$$('.qty-input'))[0].type('0.0001')

    await page.waitForTimeout(500)
    await (await page.$('.gradient-btn.w-100.h-3')).click()
  } else {
    await page.waitForTimeout(500)
    await (await page.$$('.coin-select'))[1].click()

    await page.waitForTimeout(500)
    await (await (await page.$('.modal-container')).$$('.asset-item'))[4].click()

    await page.waitForTimeout(1500)
    await (await (await page.$('.modal-container')).$$('.nft-card'))[0].click()

    await (await page.$$('.qty-input'))[0].type('0.0001')

    await page.waitForTimeout(500)
    await (await page.$('.gradient-btn.w-100.h-3')).click()

    await page.waitForTimeout(5000)
  }
}

async function finalize () {
  await new Promise(resolve => setTimeout(resolve, 10000))
}

// Execute the tests
runTests().catch(error => {
  console.error('Error during tests:', error)
})
