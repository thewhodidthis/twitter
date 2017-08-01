'use strict'

const config = require('../config')()
const client = require('../')(config)

client.pull('search/tweets', { q: '#IraqCasualties' }, (error, { search_metadata }) => {
  if (error) {
    console.error(error)
  } else {
    console.log(search_metadata)
  }
})
