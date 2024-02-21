/**
 * @file Defines the web-app as a class for UI testing
 */

const { BaseClass } = require('@portaldefi/core')
const puppeteer = require('puppeteer')

/**
 * Export the App page-object model
 * @type {App}
 */
module.exports = class App extends BaseClass {
  /**
   * Constructs a new instance of the App page-object model for a user
   *
   * The App page-object model abstracts the web-app UI to expose simple methods
   * that may be used for the purpose of UI testing.
   *
   * @param {Object} props Properties of the instance
   * @param {String} props.id The unique identifier of the user
   * @constructor
   */
  constructor (props) {
    super({ log: { prefix: props.id } })

    this.id = props.id
    this.browser = null
    this.page = null

    Object.seal(this)
  }

  /**
   * Opens a new browser tab and navigates to the specified url
   * @param {String} url The URL to navigate to
   * @param {Object} opts Launch options for puppeteer
   * @returns {Promise<Void>}
   */
  async open (url, opts) {
    try {
      // launch a browser window
      this.browser = await puppeteer.launch(opts)

      // create a new page/tab, if needed
      const pages = await this.browser.pages()
      this.page = pages.length === 0
        ? await this.browser.newPage()
        : pages[pages.length - 1]

      // navigate to the specified url
      this.info(`${this.id}.open`, { url })
      await this.page.goto(url)
    } catch (err) {
      this.error(err)
      this.emit('error', err)
    }
  }

  /**
   * Closes the browser
   * @returns {Promise<Void>}
   */
  async close () {
    return this.browser.close()
  }

  /**
   * Causes the user to be logged in
   * @param {Number} index The index of the user in the login drop-down list
   * @returns {Promise<Void>}
   */
  async login (index) {
    const { page } = this

    // Click the login button
    await page.click('#connect-wallet')

    // Wait for the dropdown to be rendered
    try {
      await page.waitForSelector('.MuiList-root')
    } catch (err) {
      this.error(err)
      this.emit('error', err)
      return
    }

    // Wait for the list items to be rendered and click the item
    const list = await page.$$('.MuiList-root li')
    if (list[index] == null) {
      const listLength = Object.keys(list).length
      this.error(`${this.id}.login`, { index, list })
      this.emit('error', Error(`invalid index ${index} of ${listLength}!`))
      return
    }

    // Click the name of the user
    await list[index].click()

    // Wait for the logout button to be rendered
    try {
      await page.waitForSelector('#logout')
    } catch (err) {
      this.error(err)
      this.emit('error', err)
      return
    }

    this.info(`${this.id}.login`, { index })
  }

  /**
   * Submits a limit order
   * @returns {Promise<Void>}
   */
  async submitLimitOrder () {
    throw Error('not implemented')
  }

  /**
   * Cancels a limit order
   * @returns {Promise}
   */
  async cancelLimitOrder () {
    throw Error('not implemented')
  }

  /**
   * Logs the user out
   * @returns {Promise<Void>}
   */
  async logout () {
    const { page } = this

    // Click the logout button
    await page.click('#logout')
    this.info(`${this.id}.logout`)
  }
}
