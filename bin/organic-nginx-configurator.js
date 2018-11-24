#!/usr/bin/env node
const path = require('path')

let hostCWD = process.cwd()
process.chdir(path.resolve(__dirname, '../'))
const Angel = require('organic-angel')
let angel = new Angel()
require('angelscripts-install-as-daemon')(angel)
if (!process.argv[3]) {
  angel.do('install ' + process.argv[2])
} else {
  let templatePath = process.argv[3]
  if (templatePath.indexOf('/') !== 0) {
    templatePath = path.resolve(hostCWD, templatePath)
  }
  angel.do('install ' + process.argv[2] + ' ' + templatePath)
}
