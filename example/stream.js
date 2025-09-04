import createClient from "../main.js"
import keys from "./keys.js"

const client = createClient(keys)

client
  .tail("statuses/sample")
  .on("error", console.error)
  .on("data", ({ text }) => {
    if (text) {
      console.log(text)
    }
  })
