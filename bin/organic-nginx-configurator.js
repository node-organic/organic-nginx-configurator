#!/usr/bin/env node

const path = require('path')
const exec = require('../lib/exec')
let hostCWD = process.cwd()
process.chdir(path.resolve(__dirname, '../'))
if (!process.argv[3]) {
  exec('npx angel install ' + process.argv[2])
} else {
  let templatePath = process.argv[3]
  if (templatePath.indexOf('/') !== 0) {
    templatePath = path.resolve(hostCWD, templatePath)
  }
  exec('npx angel install ' + process.argv[2] + ' ' + templatePath)
}
