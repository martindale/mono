const puppeteer = require('puppeteer')
const path = require('path')

const wait = (t) => {
  return new Promise((res, rej) => {
    setTimeout(res, t)
  })
}

const main = async () => {
  try {
    const unisatExtPath = path.join(process.cwd(), 'src/test/crx/unisat')

    const browser = await puppeteer.launch({
      headless: 'new',
      // headless: false,
      args: [
        `--disable-extensions-except=${unisatExtPath}`,
        `--load-extension=${unisatExtPath}`
      ]
    })
    const projPage = (await browser.pages())[0]
    await projPage.goto('http://localhost:5173') // Open the Proj

    projPage.on('dialog', async dialog => { // Handle Accept on Wallet Select Prompt
      await dialog.accept('1')
    })

    await wait(5000)

    const newUniSatPage = (await browser.pages())[1]
    await (await newUniSatPage.$('.layout > div:first-child > div:first-child > div:nth-child(2) > div:nth-child(2)')).click() // Click on Create new Wallet

    await wait(500)

    const inputs = await newUniSatPage.$$('input') // Input passwords
    await inputs[0].type('TESTPW123')
    await inputs[1].type('TESTPW123')
    await (await newUniSatPage.$('.layout > div:first-child > div:first-child > div:first-child > div:nth-child(5)')).click() // Click on Continue

    await wait(500)

    const seedContainer = await (await newUniSatPage.$('.layout > div:nth-child(2) > div:nth-child(2) > div:nth-child(4) > div:first-child')).$$('.row-container'); const seeds = []
    for (let i = 0; i < 12; i++) {
      const seed = await seedContainer[i].$eval('div:nth-child(2) > div:first-child > span', el => el.innerHTML)
      seeds.push(seed)
    }
    console.log(seeds)

    await (await newUniSatPage.$('.layout > div:nth-child(2) > div:nth-child(2) > div:nth-child(5) > label')).click() // Saved Radio Check
    await (await newUniSatPage.$('.layout > div:nth-child(2) > div:nth-child(2) > div:nth-child(6) > div:nth-child(2) > div:first-child')).click() // Click on Continue

    await wait(500)
    await (await newUniSatPage.$('.layout > div:nth-child(2) > div:nth-child(2) > div:nth-child(10) > div:nth-child(2) > div:first-child')).click() // Click on Continue

    await newUniSatPage.close()

    await wait(2000)

    // Unisat Wallet Connect

    await (await projPage.$('.connect-bitcoin')).click()
    await (await projPage.$('#connect-l1')).click()

    await wait(3000)

    const walletDlg = (await browser.pages())[1]
    await (await walletDlg.$('.layout > div:nth-child(3) > div:first-child > div:nth-child(2)')).click() // Click on Connect
    console.log('Unisat Wallet Connected')

    await wait(2000)

    await (await (await projPage.$('.connect-modal-color')).$('.simulate-l1')).click()

    await wait(3000)

    await browser.close()
  } catch (e) {
    console.error(e)
  }
}

module.exports = async () => {
  main()
}
