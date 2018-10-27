const fs = require('fs')
const path = require('path')
const Plasma = require('organic-plasma')
const NginxOrganelle = require('../organelles/nginx-config')
const sleep = async (interval) => {
  return new Promise((resolve, reject) => {
    setTimeout(resolve, interval)
  })
}
const nginxDNA = {
  'channel': false,
  'templatePath': './nginx.conf.ejs',
  'nginxReloadInterval': 10,
  'configPath': false,
  'store': 'store.test.json'
}

beforeAll(() => {
  process.env.DRY = 1
})
afterAll(() => {
  delete process.env.DRY
})

test('persistant store', async () => {
  let plasma = new Plasma()
  let nginx = new NginxOrganelle(plasma, nginxDNA)
  expect(nginx.startedCells.length).toBe(0)
  nginx.updateNGINX()
  await sleep(11)
})
