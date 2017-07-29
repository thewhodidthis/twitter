'use strict'

const config = require('../config')()
const client = require('../')(config)

client.pull('search/tweets', { q: '#IraqCasualties' }, (error, data) => {
  if (error) {
    console.error(error)
  } else {
    console.log(data.search_metadata)
  }
})
