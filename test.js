import nock from "nock"
import process from "process"
import { assert, report } from "tapeless"
import createClient from "./main.js"

const { equal, ok } = assert
const {
  npm_config_consumer_key: consumer_key,
  npm_config_consumer_secret: consumer_secret,
  npm_config_access_token_key: access_token_key,
  npm_config_access_token_secret: access_token_secret,
} = process.env

const config = { consumer_key, consumer_secret, access_token_key, access_token_secret }
const client = createClient(config)

process.on("exit", report)

ok
  .describe("client", "will init")
  .test(client) // Streaming
;(() => {
  nock("https://stream.twitter.com")
    .get("/1.1/statuses/sample.json")
    .reply(200, () => `
{ "created_at": "Mon Jul 31 19:08:39 +0000 2017", "id": 892099708851703800, "id_str": "892099708851703808", "text": "最近ずっとムラムラしてるんです♪https://t.co/JjLBxPWcNZ" }\r
{ "created_at": "Mon Jul 31 19:08:39 +0000 2017", "id": 892099708860207100, "id_str": "892099708860207105", "text": "Negrometál" }\r
    `)

  client.tail("statuses/sample")
    .on("data", ({ text }) => {
      ok
        .describe(`text: ${text}`, "will stream")
        .test(text)
    })
})() // Searching
;(() => {
  const params = { q: "#trump", count: 1 }

  nock("https://api.twitter.com")
    .get("/1.1/search/tweets.json")
    .query(params)
    .reply(200, {
      statuses: [{
        text:
          "RT @DearAuntCrabby: Installing Gen John Kelly as Chief of Staff in the #Trump White House is like putting on fresh pair tighty-whities",
      }],
    })

  client.pull("search/tweets", params, (error, { statuses = [] } = {}) => {
    equal
      .describe("no errors")
      .test(error, null)

    ok
      .test(statuses)
      .test(Array.isArray(statuses))

    equal
      .describe(null, "will search")
      .test(statuses.length, 1)
  })
})() // Error handling
;(() => {
  nock("https://api.twitter.com")
    .post("/1.1/statuses/mama.json")
    .replyWithError({ code: 404, message: "Not Found" })

  client.push("statuses/mama", (error, data) => {
    const { code, message } = error

    ok
      .describe(`${code} ~> ${message}`)
      .test(error)

    equal
      .describe("data not", "will report errors")
      .test(data, undefined)
  })

  const params = { status: "Exists!" }

  // https://dev.twitter.com/overview/api/response-codes
  nock("https://api.twitter.com")
    .post("/1.1/statuses/update.json")
    .query(params)
    .reply(200, { errors: [{ message: "Status is a duplicate", code: 187 }] })

  client.push("statuses/update", params, (error, data) => {
    const { code, message } = error

    ok
      .describe(`${code} ~> ${message}`)
      .test(error)

    equal
      .describe("data not", "will report extra errors")
      .test(data, undefined)
  })
})()
