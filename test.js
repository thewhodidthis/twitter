const test = require('tape')

const config = require('./config')()
const client = require('./')(config)

test('will init', (t) => {
  t.ok(client)
  t.end()
})

test('will search', (t) => {
  t.plan(3)

  client.pull('search/tweets', { q: '#trump', count: 1 }, (error, data) => {
    const { statuses } = data

    t.notOk(error)
    t.ok(statuses)
    t.equals(statuses.length, 1)
  })
})
