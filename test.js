'use strict'

const nock = require('nock')
const { ok, equal } = require('tapeless')

const config = require('./config')()
const client = require('./')(config)

ok(client, 'client', 'will init')

// Streaming
;(() => {
  nock('https://stream.twitter.com')
    .get('/1.1/statuses/sample.json')
    .reply(200, () => `
      { "created_at": "Mon Jul 31 19:08:39 +0000 2017",
        "id": 892099708851703800,
        "id_str": "892099708851703808",
        "text": "最近ずっとムラムラしてるんです♪https://t.co/JjLBxPWcNZ" }\r
      { "created_at": "Mon Jul 31 19:08:39 +0000 2017",
        "id": 892099708860207100,
        "id_str": "892099708860207105",
        "text": "Negrometál" }\r
    `)

  client
    .tail('statuses/sample')
    .on('data', ({ text }) => {
      ok(text, `text: ${text}`, 'will stream')
    })
})()

// Searching
;(() => {
  const params = { q: '#trump', count: 1 }

  nock('https://api.twitter.com')
    .get('/1.1/search/tweets.json')
    .query(params)
    .reply(200, { statuses: [{ text: 'RT @DearAuntCrabby: Installing Gen John Kelly as Chief of Staff in the #Trump White House is like putting on fresh pair tighty-whities' }] })

  client.pull('search/tweets', params, (error, { statuses }) => {
    equal(error, null, 'no errors', 'will search')
    ok(statuses)
    ok(Array.isArray(statuses))
    equal(statuses.length, 1)
  })
})()

// Error handling
;(() => {
  nock('https://api.twitter.com')
    .post('/1.1/statuses/mama.json')
    .replyWithError({ code: 404, message: 'Not Found' })

  client.push('statuses/mama', (error, data) => {
    const { code, message } = error

    ok(error, `${code} ~> ${message}`, 'will report errors')
    equal(data, undefined, 'data not')
  })

  const params = { status: 'Exists!' }

  // https://dev.twitter.com/overview/api/response-codes
  nock('https://api.twitter.com')
    .post('/1.1/statuses/update.json')
    .query(params)
    .reply(200, { errors: [{ message: 'Status is a duplicate', code: 187 }] })

  client.push('statuses/update', params, (error, data) => {
    const { code, message } = error

    ok(error, `${code} ~> ${message}`, 'will report extra errors')
    equal(data, undefined, 'data not')
  })
})()
