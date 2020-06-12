'use strict'

const crypto = require('crypto')

const keys = require('./keys.js')
const client = require('../')(keys)

const randomHexString = crypto.randomBytes(64).toString('hex').substring(0, 144)

client.push('statuses/update', { status: randomHexString }, (error, data) => {
  if (error) {
    console.error(error)
  } else {
    console.log(data.text)
  }
})
