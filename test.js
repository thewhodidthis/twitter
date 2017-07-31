'use strict'

const test = require('tape')
const nock = require('nock')

const config = require('./config')()
const client = require('./')(config)

test('will init', (t) => {
  t.ok(client)
  t.end()
})

test('will stream', (t) => {
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

  t.plan(2)

  client
    .tail('statuses/sample')
    .on('data', ({ text }) => {
      t.ok(text, `text: ${text}`)
    })
})

test('will search', (t) => {
  const params = { q: '#trump', count: 1 }

  nock('https://api.twitter.com')
    .get('/1.1/search/tweets.json')
    .query(params)
    .reply(200, { statuses: [{ text: 'RT @DearAuntCrabby: Installing Gen John Kelly as Chief of Staff in the #Trump White House is like putting on fresh pair tighty-whities' }] })

  t.plan(4)

  client.pull('search/tweets', params, (error, { statuses }) => {
    t.notOk(error)
    t.ok(statuses)
    t.ok(Array.isArray(statuses))
    t.equals(statuses.length, 1)
  })
})

test('will report errors', (t) => {
  nock('https://api.twitter.com')
    .post('/1.1/statuses/mama.json')
    .replyWithError({ code: 404, message: 'Not Found' })

  t.plan(2)

  client.push('statuses/mama', (error, data) => {
    const { code, message } = error

    t.ok(error, `${code} ~> ${message}`)
    t.notOk(data)
  })
})

test('will report extra errors', (t) => {
  const params = { status: 'Exists!' }

  // https://dev.twitter.com/overview/api/response-codes
  nock('https://api.twitter.com')
    .post('/1.1/statuses/update.json')
    .query(params)
    .reply(200, { errors: [{ message: 'Status is a duplicate', code: 187 }] })

  t.plan(2)

  client.push('statuses/update', params, (error, data) => {
    const { code, message } = error

    t.ok(error, `${code} ~> ${message}`)
    t.notOk(data)
  })
})
