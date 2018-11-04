#!/usr/bin/env node

const path = require('path')
const Angel = require('organic-angel')
const angel = new Angel()
process.chdir(path.resolve(__dirname, '../'))
angel.scripts.loadScript(path.resolve(__dirname, '../scripts/install.js'), () => {
  if (!process.argv[3]) {
    angel.do('install ' + process.argv[2])
  } else {
    angel.do('install ' + process.argv[2] + ' ' + process.argv[3])
  }
})
