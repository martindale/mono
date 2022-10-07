#!/usr/bin/env node
/**
 * @file Starts the Portal server
 */

const Context = require('../lib/core/context')
const Server = require('../lib/core/server')

/**
 * The main() IIFE
 * @returns {Void}
 */
;(function main () {
  const server = new Server()
  const logAndExit = event => err => {
    Context.log.error(event, err)
    process.exit(1)
  }

  server
    .on('start', Context.log.info)
    .on('error', Context.log.error)
    .on('log', (level, ...args) => Context.log[level](...args))
    .on('stop', Context.log.info)
    .start()

  process
    .on('uncaughtException', logAndExit('uncaughtException'))
    .on('unhandledRejection', logAndExit('unhandledRejection'))
}())
