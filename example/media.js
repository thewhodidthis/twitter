import createClient from "../main.js"
import image from "./image.js"
import keys from "./keys.js"

const client = createClient(keys)

// Repost
const post = ({ media_id_string = "" } = {}) => {
  const tweet = {
    status: "Look ma, uploads!",
    media_ids: media_id_string,
  }

  client.push("statuses/update", tweet, (error, data) => {
    if (error) {
      console.error(error)
    } else {
      console.log(data.text)
    }
  })
}

// Upload
client.push("media/upload", { media_data: image }, (error, data) => {
  if (error) {
    console.error(error)
  } else {
    post(data)
  }
})
