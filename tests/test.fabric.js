'use strict';

// Settings
const settings = require('../settings/test');

// Dependencies
const assert = require('assert');

// Fabric Types
const Actor = require('@fabric/core/types/actor');
const Filesystem = require('@fabric/core/types/filesystem');
const Peer = require('@fabric/core/types/peer');

describe('@fabric/core', function () {
  describe('Actor', function () {
    it('is available from @fabric/core', function () {
      assert.equal(Actor instanceof Function, true);
    });
  });

  describe('Filesystem', function () {
    it('is available from @fabric/core', function () {
      assert.equal(Filesystem instanceof Function, true);
    });
  });

  describe('Peer', function () {
    it('is available from @fabric/core', function () {
      assert.equal(Peer instanceof Function, true);
    });
  });
});
