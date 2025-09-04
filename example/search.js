import createClient from "../main.js"
import keys from "./keys.js"

const client = createClient(keys)

client.pull("search/tweets", { q: "#IraqCasualties" }, (error, data) => {
  if (error) {
    console.error(error)
  } else {
    console.log(data.search_metadata)
  }
})
