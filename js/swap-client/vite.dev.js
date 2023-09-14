const { resolve } = require('path')

// https://vitejs.dev/config/
module.exports = {
  root: resolve(__dirname),
  build: {
    outDir: resolve(__dirname, 'dist'),
    watch: {}
  },
  mode: 'development',
  clearScreen: false,
  logLevel: 'silent'
}
