const puppeteer = require('puppeteer')
const path = require('path')

const wait = (t) => {
  return new Promise((res, rej) => {
    setTimeout(res, t)
  })
}

const main = async () => {
  try {
    const unisatExtPath = path.join(process.cwd(), 'src/test/crx/xverse')

    const browser = await puppeteer.launch({
      // headless: 'new',
      headless: false,
      args: [
        `--disable-extensions-except=${unisatExtPath}`,
        `--load-extension=${unisatExtPath}`
      ]
    })
    const projPage = (await browser.pages())[0]
    await projPage.goto('http://localhost:5173') // Open the Proj

    projPage.on('dialog', async dialog => { // Handle Accept on Wallet Select Prompt
      await dialog.accept('2')
    })

    await wait(2000)

    await (await projPage.$('.connect-bitcoin')).click()
    await (await projPage.$('#connect-l1')).click()

    await wait(2000)

    /* Create New Wallet */
    const walletCreateDlg = (await browser.pages())[1]
    await (await walletCreateDlg.$$('button'))[0].click()

    await wait(2000)

    const walletCreatePage = (await browser.pages())[2]
    /** Create Xverse Wallet Window opened */

    await (await walletCreatePage.$$('button'))[1].click() /** Next button */
    await wait(500)
    await (await walletCreatePage.$$('button'))[1].click() /** Next button */
    await wait(500)
    await (await walletCreatePage.$$('button'))[0].click() /** Continue button */
    await wait(500)
    await (await walletCreatePage.$$('button'))[0].click() /** Accept button */
    await wait(500)
    await (await walletCreatePage.$$('button'))[0].click() /** Backup Later button */
    await wait(500)
    await (await walletCreatePage.$$('input'))[0].type('TESTPW123') /** Password Input */
    await wait(500)
    await (await walletCreatePage.$$('button'))[2].click()
    await wait(500)
    await (await walletCreatePage.$$('input'))[0].type('TESTPW123') /** Password Confirm */
    await wait(500)
    await (await walletCreatePage.$$('button'))[2].click() /** Confirm Button */
    await wait(2000)
    await (await walletCreatePage.$$('button'))[0].click() /** Close Create Window */

    await walletCreateDlg.close()

    await (await projPage.$('.connect-bitcoin')).click()
    await wait(500)
    await (await projPage.$('#connect-l1')).click()

    await wait(7000)
    const walletDlg = (await browser.pages())[1]
    // Xverse control
    await (await walletDlg.$('input')).type('TESTPW123')
    await (await walletDlg.$$('button'))[1].click()

    await wait(5000)
    await (await walletDlg.$$('button'))[2].click()
    console.log('Xverse Wallet Connected!')

    await wait(1000)

    await (await (await projPage.$('.connect-modal-color')).$('.simulate-l1')).click() // Simulate Payment
    await wait(3000)

    const approveDlg = (await browser.pages())[1]
    /* const text = await approveDlg.$eval('.iwDLzk', el => el.innerHTML);
    if(text.indexOf('Close') === -1) {
      await (await approveDlg.$('.iwDLzk')).click();
    } else {
      throw new Error('Insufficient Balance!');
    } */

    console.log('Payment Simulate Done!')
    await browser.close()
  } catch (e) {
    console.error(e)
  }
}

// module.exports = async () => {
main()
// }
