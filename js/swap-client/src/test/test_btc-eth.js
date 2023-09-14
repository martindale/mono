const puppeteer = require('puppeteer')

async function runTests () {
  const alice = await setupBrowser()
  const bob = await setupBrowser()

  await performLogin(alice, 1)
  await performLogin(bob, 2)

  await createOrder(alice, 'alice')
  await createOrder(bob, 'bob')

  await finalize()

  await alice.close()
  await bob.close()
}

async function setupBrowser () {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--window-size=1920,1096'] })
  const page = await browser.newPage()
  await page.goto('http://localhost:5173')
  return browser
}

async function performLogin (browser, index) {
  // Explicitly get the page we want to work with
  const pages = await browser.pages()
  const page = pages[1] // This should be the second tab (index 1)

  // Debugging output
  console.log(`Attempting to login with index: ${index}`)

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
  const page = pages[pages.length - 1] // Get the last page

  if (identifier === 'bob') { // TODO: Remove bob check and manually choose opposite pairs (remove state)
    const exchangeButton = await page.$('.exchange')
    if (!exchangeButton) {
      throw new Error('Exchange button not found for Bob')
    }
    await exchangeButton.click()
  }

  const inputs = await page.$$('.qty-input')
  if (!inputs || inputs.length < 2) {
    throw new Error(`Input fields not found for ${identifier}`)
  }
  await inputs[0].type('.0001')
  await inputs[1].type('.0001')

  const [swapButton] = await page.$x("//button[contains(., 'Swap')]")
  if (!swapButton) {
    throw new Error(`Swap button not found for ${identifier}`)
  }
  await swapButton.click()

  await page.waitForSelector('.activitiesContainer')
  // await page.screenshot({ path: 'debug_screenshot.png' });
  await page.waitForTimeout(1000) // wait for 5 seconds
  const activities = await page.$$('.activitiesContainer .activity-item')
  if (!activities || activities.length === 0) {
    throw new Error(`Activity items not found for ${identifier}`)
  }
  await activities[0].click()
}

async function finalize () {
  await new Promise(resolve => setTimeout(resolve, 10000))
}

// Execute the tests
runTests().catch(error => {
  console.error('Error during tests:', error)
})
