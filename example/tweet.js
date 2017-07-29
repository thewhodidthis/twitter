'use strict'

const crypto = require('crypto')
const config = require('../config')()
const client = require('../')(config)

const status = crypto.randomBytes(64).toString('hex').substring(0, 144)

client.push('statuses/update', { status }, (error, data) => {
  if (error) {
    console.error(error)
  } else {
    console.log(data.text)
  }
})
