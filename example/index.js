'use strict'

const path = require('path')
const fs = require('fs')

const ls = (error, files) => {
  if (error) {
    console.error(error)
  } else {
    files
      .filter(f => !f.includes('index'))
      .filter(f => path.extname(f) === '.js')
      .forEach((file, i) => {
        const name = file.split('.').shift()

        console.log(`${i + 1}. example/${name}`)
      })
  }
}

fs.readdir(__dirname, ls)
