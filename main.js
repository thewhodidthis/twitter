import https from "https"
import { stringify } from "querystring"
import { fixPath, isFunction, simpleOauth, strictEncode } from "./helper.js"
import { split, unite } from "./parser.js"

export default function createClient(credentials = {}) {
  const getAuthorizationToken = simpleOauth(credentials)
  const send = (options = {}, params, parser) => {
    const { path } = options

    // For now, but see: https://dev.twitter.com/webhooks/account-activity
    if (path === "user" || path === "site") {
      options.hostname += path
    }

    // Marginally relevant for GET requests as well
    if (path.includes("media")) {
      options.hostname = "upload.twitter.com"
    }

    // When streaming
    if (path.includes("filter")) {
      options.method = "POST"
    }

    const queryString = stringify(params, null, null, { encodeURIComponent: strictEncode })

    const defaults = {
      headers: {
        "Accept": "*/*",
        "User-Agent": `minion`,
      },
      hostname: "api.twitter.com",
      method: "GET",
      port: 443,
    }

    const settings = Object.assign({}, defaults, options)

    const basePath = "/1.1/"
    const pathname = fixPath(basePath, path)

    settings.path = queryString ? `${pathname}?${queryString}` : pathname
    settings.headers.authorization = getAuthorizationToken(settings, params)

    https
      .request(settings)
      .on("error", (e) => {
        parser.emit("error", e)
      })
      .on("response", (response) => {
        const { socket, statusCode: code, statusMessage: message } = response

        if (code === 200) {
          response
            .pipe(parser)
            .on("finish", () => {
              socket.destroy()
            })
        } else {
          parser.emit("error", { code, message })
        }

        // Emitted instead of an error event when the response closes prematurely
        response
          .on("aborted", () => {
            parser.end()
          })
      })
      .end()

    return parser
  }

  // Shared across public methods below
  const pull = (options = {}, ...rest) => {
    const callback = rest.find(isFunction)
    const params = rest.filter(item => !isFunction(item)).pop()

    const { hostname } = options
    const parser = (hostname && hostname.includes("stream") ? split : unite)(callback)

    return send(options, params, parser)
  }

  return {
    // Remove
    drop: (path, ...rest) => pull({ path, method: "DELETE" }, ...rest),
    // Read
    pull: (path, ...rest) => pull({ path }, ...rest),
    // Publish
    push: (path, ...rest) => pull({ path, method: "POST" }, ...rest),
    // Stream
    tail: (path, ...rest) => pull({ path, hostname: "stream.twitter.com" }, ...rest),
  }
}
