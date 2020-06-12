'use strict'

const path = require('path')
const fs = require('fs')

// List available examples
const ls = (error, files) => {
  if (error) {
    console.error(error)
  } else {
    files
      .filter(f => path.extname(f) === '.js')
      .filter(f => !f.includes('keys'))
      .filter(f => !f.includes('index'))
      .forEach((file, i) => {
        const name = file.split('.').shift()

        console.log(`${i + 1}. example/${name}`)
      })
  }
}

fs.readdir(__dirname, ls)
