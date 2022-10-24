/**
 * @file Configuration for the Truffle framework
 */

/**
 * Export the configuration
 * @type {Object}
 */
const fs = require('fs');

const configPath = process.env.TRUFFLE_CONF_PATH ? process.env.TRUFFLE_CONF_PATH : './truffle-config.json';
const Config = module.exports = JSON.parse(fs.readFileSync(configPath));
/**
 * Flag checking if debugging is enabled
 * @type {Boolean}
 */
const debugEnabled = Object.values(process.argv).includes('--debug')

/**
 * Start a test blockchain instance
 */
require('ganache')
  .server({
    logging: {
      quiet: !debugEnabled,
      verbose: debugEnabled
    }
  })
  .listen(Config.networks.development.port)
