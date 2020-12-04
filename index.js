'use strict'

const createDeep = require('./create-deep')

module.exports = mixin = (app) => {

    app.loopback.modelBuilder.mixins.define('CreateDeep', createDeep)
}