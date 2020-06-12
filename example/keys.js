const {
  CONSUMER_KEY,
  CONSUMER_SECRET,
  ACCESS_TOKEN_KEY,
  ACCESS_TOKEN_SECRET,
  npm_config_CONSUMER_KEY: consumer_key = CONSUMER_KEY,
  npm_config_CONSUMER_SECRET: consumer_secret = CONSUMER_SECRET,
  npm_config_ACCESS_TOKEN_KEY: access_token_key = ACCESS_TOKEN_KEY,
  npm_config_ACCESS_TOKEN_SECRET: access_token_secret = ACCESS_TOKEN_SECRET
} = process.env

module.exports = { consumer_key, consumer_secret, access_token_key, access_token_secret }
