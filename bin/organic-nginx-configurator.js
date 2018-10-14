#!/bin/node
const path = require('path')
const exec = require('../lib/exec')
exec('npx organic-angel install ' + process.argv[2], {
  cwd: path.resolve(__dirname, '../'),
  env: process.env
}).catch((err) => {
  console.error(err)
  process.exit(1)
})
