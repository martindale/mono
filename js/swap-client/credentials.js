const alice = require('../portal/test/unit/alice.js')
const bob = require('../portal/test/unit/bob.js')
const { mkdirSync, writeFileSync } = require('fs')
const { join } = require('path')

try {
  mkdirSync(join(__dirname, 'src', 'utils', 'credentials'))
} catch (err) {
  if (err.code !== 'EEXIST') throw err
}

// Convert the credentials object to JSON and save it inside utils
writeFileSync(join(__dirname, 'src', 'utils', 'credentials', 'alice.json'), JSON.stringify(alice, null, 2))
writeFileSync(join(__dirname, 'src', 'utils', 'credentials', 'bob.json'), JSON.stringify(bob, null, 2))
