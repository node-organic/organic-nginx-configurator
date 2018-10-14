#!/bin/node
const path = require('path')
const exec = require('../lib/exec')
exec('npx angel install ' + process.argv[2], {
  cwd: path.basename(__dirname)
})
