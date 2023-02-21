import { Writable } from "stream"

const noop = v => v

// Used for parsing newline delimited JSON when consuming streaming
// data, based on: @ndjson/ndjson-spec, @maxogden/ndjson, @mcollina/split2
export function split(callback = noop, delimiter = /\r?\n/) {
  let store = ""

  const parser = new Writable({
    write(chunk, _, next) {
      const input = store + chunk.toString()
      const items = input.split(delimiter)

      store = items.pop()

      for (const item of items) {
        if (item === "") {
          continue
        }

        try {
          const data = JSON.parse(item)
          const { errors } = data

          if (errors) {
            errors.forEach((e) => {
              parser.emit("error", e)
            })
          } else {
            parser.emit("data", data)
          }
        } catch (e) {
          parser.emit("error", e)
        }
      }

      next()
    },
  })

  parser
    .on("error", (e) => {
      callback(e)
    })
    .on("data", (data) => {
      callback(null, data)
    })

  return parser
}

// The default concat stream used when collecting
// responses from non streaming API endpoints
export function unite(callback = noop) {
  const memo = []

  const parser = new Writable({
    write(chunk, _, next) {
      memo.push(chunk)
      next()
    },
  })

  parser
    .on("error", (e) => {
      callback(e)
    })
    .on("finish", () => {
      // If any of Buffer or JSON operations throw, the error gets
      // passed on to `callback` via the listener above
      const body = Buffer.concat(memo).toString()
      const data = JSON.parse(body)

      const { errors } = data

      if (errors) {
        errors.forEach((e) => {
          parser.emit("error", e)
        })
      } else {
        callback(null, data)
      }
    })

  return parser
}
