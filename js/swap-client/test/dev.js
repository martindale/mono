#!/usr/bin/env node
/**
 * @file Starts the Portal peer in development mode
 */

const Peer = require('@portaldefi/peer')
const { inspect } = require('util')
const vite = require('vite')
const config = require('../vite.dev')

function log (obj) {
  return inspect(obj, { showHidden: false, depth: null, colors: true })
}

/**
 * The main() IIFE
 * @returns {Void}
 */
;(function main () {
  const peer = new Peer({ id: 'portal', root: config.build.outDir })
  const logAndExit = event => err => {
    console.error(event, err)
    process.exit(1)
  }

  peer
    .on('error', console.error)
    .on('log', (level, ...args) => console.error(level, ...(args.map(log))))
    .once('start', peer => vite
      .build(config)
      .then(watcher => {
        process.on('SIGTERM', () => watcher.close())
        watcher.on('event', event => {
          switch (event.code) {
            case 'START':
            case 'END':
              console.error('info', 'vite.build', event)
              break

            case 'BUNDLE_START':
            case 'BUNDLE_END':
              break

            default:
              console.error('error', 'vite.build', event)
              break
          }
        })
      }))
    .start()

  process
    .on('uncaughtException', logAndExit('uncaughtException'))
    .on('unhandledRejection', logAndExit('unhandledRejection'))
    .on('SIGTERM', () => peer.stop())
}())
