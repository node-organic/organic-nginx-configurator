#!/usr/bin/env node

const path = require('path')
const Angel = require('organic-angel')
const angel = new Angel()
let hostCWD = process.cwd()
process.chdir(path.resolve(__dirname, '../'))
angel.scripts.loadScript(path.resolve(__dirname, '../scripts/install.js'), () => {
  if (!process.argv[3]) {
    angel.do('install ' + process.argv[2])
  } else {
    let templatePath = process.argv[3]
    if (templatePath.indexOf('/') !== 0) {
      templatePath = path.resolve(hostCWD, templatePath)
    }
    angel.do('install ' + process.argv[2] + ' ' + templatePath)
  }
})
