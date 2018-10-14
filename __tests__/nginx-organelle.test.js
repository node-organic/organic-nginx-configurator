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
  'nginxReloadInterval': 100,
  'configPath': false,
  'reannonceTimeout': 100
}
let plasma
let nginx

beforeAll(() => {
  plasma = new Plasma()
  nginx = new NginxOrganelle(plasma, nginxDNA)
  nginx.startedCells = []
  process.env.DRY = 1
})
afterAll(() => {
  delete process.env.DRY
})
test('updateNGINX works with backoff delay', async () => {
  expect(nginx.updateNGINXTimeoutID).toBe(undefined)
  nginx.updateNGINX()
  expect(nginx.updateNGINXTimeoutID).toBeDefined()
  let lastID = nginx.updateNGINXTimeoutID
  nginx.updateNGINX()
  expect(nginx.updateNGINXTimeoutID).toBe(lastID)
  await sleep(110)
  expect(nginx.updateNGINXTimeoutID).toBe(null)
  nginx.updateNGINX()
  expect(nginx.updateNGINXTimeoutID).toBeDefined()
  await sleep(110)
  expect(nginx.updateNGINXTimeoutID).toBe(null)
})
test('cell notify actions', async () => {
  nginx.handleChemical({
    action: 'onCellStarting',
    cellInfo: {
      name: 'test',
      version: '',
      domain: 'test',
      endpoint: 'test',
      mountpoint: ''
    }
  })
  nginx.handleChemical({
    action: 'onCellStarting',
    cellInfo: {
      name: 'test',
      version: '',
      domain: 'test',
      endpoint: 'test:2',
      mountpoint: ''
    }
  })
  nginx.handleChemical({
    action: 'onCellStopping',
    cellInfo: {
      name: 'test',
      version: '',
      domain: 'test',
      endpoint: 'test',
      mountpoint: ''
    }
  })
  expect(nginx.startedCells.length).toBe(1)
  expect(nginx.updateNGINXTimeoutID).toBeDefined()
  await sleep(110)
  expect(nginx.updateNGINXTimeoutID).toBe(null)
})
test('cell annoncing', (done) => {
  nginx.dna.channel = {
    emitReannonceType: 'test'
  }
  nginx.broadcastReannonce()
  plasma.once('test', (c) => {
    expect(c).toBeDefined()
    done()
  })
})
