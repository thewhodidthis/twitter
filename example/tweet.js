import crypto from "crypto"
import createClient from "../main.js"
import keys from "./keys.js"

const randomHexString = crypto.randomBytes(64).toString("hex").substring(0, 144)
const client = createClient(keys)

client.push("statuses/update", { status: randomHexString }, (error, data) => {
  if (error) {
    console.error(error)
  } else {
    console.log(data.text)
  }
})
