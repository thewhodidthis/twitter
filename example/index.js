'use strict';

const fs = require('fs');
const util = require('util');
const path = require('path');

// http://stackoverflow.com/questions/18112204/get-all-directories-within-directory-nodejs
const ls = fs.readdirSync(__dirname).filter(file => {
  return fs.statSync(path.join(__dirname, file)).isDirectory();
});

ls.forEach((dir, idx) => {
  console.log(`${idx + 1}. example/${dir}`);
});

