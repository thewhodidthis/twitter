import process from "process"

const {
  CONSUMER_KEY,
  CONSUMER_SECRET,
  ACCESS_TOKEN_KEY,
  ACCESS_TOKEN_SECRET,
  npm_config_consumer_key: consumer_key = CONSUMER_KEY,
  npm_config_consumer_secret: consumer_secret = CONSUMER_SECRET,
  npm_config_access_token_key: access_token_key = ACCESS_TOKEN_KEY,
  npm_config_access_token_secret: access_token_secret = ACCESS_TOKEN_SECRET,
} = process.env

export default {
  consumer_key,
  consumer_secret,
  access_token_key,
  access_token_secret,
}
