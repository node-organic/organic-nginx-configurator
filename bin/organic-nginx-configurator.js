#!/bin/node
const path = require('path')
const Angel = require('organic-angel')
const angel = new Angel()
process.chdir(path.resolve(__dirname, '../'))
angel.scripts.loadScript(path.resolve(__dirname, '../scripts/install.js'), () => {
  angel.do('install ' + process.argv[2])
})
