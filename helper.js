import crypto from "crypto"
import { stringify } from "querystring"
import url from "url"

// Used to separate out callbacks when parsing optional arguments
export const isFunction = a => typeof a === "function"

// Expand on `encodeURIComponent` for percent encoding that works
// https://github.com/kevva/strict-uri-encode
const repair = c => `%${c.charCodeAt(0).toString(16).toUpperCase()}`
export const strictEncode = s => encodeURIComponent(s).replace(/[!'()*]/g, repair)

// Path math
const cutTrailingSlash = s => s.replace(/\/$/, "")
const addExtension = (s, ext = "json") => (s.split(".").pop() === ext ? s : `${s}.${ext}`)
export const fixPath = (base = "", path = "") => addExtension(cutTrailingSlash(url.resolve(base, path)))

// Reorder object keys
// https://github.com/nodejs/node/issues/6594
const sorted = (source) => {
  const result = Object.create(null)
  const buffer = Object.keys(source).sort()

  for (const k of buffer) {
    result[k] = source[k]
  }

  return result
}

// OAuth string compilation from scratch
// https://developer.twitter.com/en/docs/basics/authentication/guides
export function simpleOauth(keys = {}) {
  const login = Object.assign({
    access_token_key: null,
    access_token_secret: null,
    consumer_key: null,
    consumer_secret: null,
  }, keys)

  return ({ hostname = "", method = "", path = "" } = {}, params = {}) => {
    const nonce = crypto.randomBytes(32).toString("base64").replace(/\W+/g, "")
    const stamp = Date.now() * 0.001

    const oauth = {
      oauth_consumer_key: login.consumer_key,
      oauth_nonce: nonce,
      oauth_signature_method: "HMAC-SHA1",
      oauth_timestamp: stamp,
      oauth_token: login.access_token_key,
      oauth_version: "1.0",
    }

    const secret = strictEncode(login.consumer_secret)
    const tokenSecret = strictEncode(login.access_token_secret)
    const signingKey = `${secret}&${tokenSecret}`

    let withParams = Object.assign({}, oauth, params)

    withParams = sorted(withParams)
    withParams = stringify(withParams, null, null, { encodeURIComponent: strictEncode })
    withParams = strictEncode(withParams)

    const { pathname } = url.parse(path)
    const href = encodeURIComponent(`https://${hostname}${pathname}`)

    const signatureBase = `${method}&${href}&${withParams}`
    const signature = crypto.createHmac("sha1", signingKey).update(signatureBase).digest("base64")

    let signed = Object.assign({}, oauth, { oauth_signature: signature })

    signed = sorted(signed)
    signed = `${stringify(signed, '", ', '="', { encodeURIComponent: strictEncode })}"`

    return `OAuth ${signed}`
  }
}
