'use strict'

const path = require('path')
const fs = require('fs')

const keys = require('./keys.js')
const client = require('../')(keys)

const image = path.join(__dirname, '/image-506x253.jpg')
const query = { media_data: fs.readFileSync(image).toString('base64') }

// Repost
const post = ({ media_id_string = '' } = {}) => {
  const tweet = {
    status: 'Look ma, uploads!',
    media_ids: media_id_string
  }

  client.push('statuses/update', tweet, (error, data) => {
    if (error) {
      console.error(error)
    } else {
      console.log(data.text)
    }
  })
}

// Upload
client.push('media/upload', query, (error, data) => {
  if (error) {
    console.error(error)
  } else {
    post(data)
  }
})
