'use strict'

const config = require('../config')()
const client = require('../')(config)

client
  .tail('statuses/sample')
  .on('error', console.error)
  .on('data', (data) => { console.log(data.text) })
