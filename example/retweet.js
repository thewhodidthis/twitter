'use strict'

const config = require('../config')()
const client = require('../')(config)

const logger = (error, data) => {
  if (error) {
    console.error(error)
  } else {
    console.log(data.text)
  }
}

const retweet = (error, data) => {
  if (error) {
    console.error(error)
  } else {
    client.push(`statuses/retweet/${data[0].id_str}`, logger)
  }
}

client.pull('statuses/user_timeline', { screen_name: '64326c30656d4a7' }, retweet)
