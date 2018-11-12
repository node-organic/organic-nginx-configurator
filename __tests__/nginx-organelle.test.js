const Plasma = require('organic-plasma')
const NginxOrganelle = require('../organelles/nginx-config')
const sleep = async (interval) => {
  return new Promise((resolve, reject) => {
    setTimeout(resolve, interval)
  })
}

const nginxDNA = {
  'templatePath': './nginx.conf.ejs',
  'nginxReloadInterval': 100,
  'configPath': false
}
let plasma
let nginx

beforeAll(() => {
  plasma = new Plasma()
  nginx = new NginxOrganelle(plasma, nginxDNA)
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
test('cell actions', async () => {
  nginx.onCellMitosisComplete({
    cellInfo: {
      name: 'test',
      version: '1.0.0',
      domain: 'test',
      endpoint: 'test',
      mountpoint: '',
      mitosis: {
        apoptosis: {
          versionConditions: ['major']
        }
      }
    }
  })
  nginx.onCellMitosisComplete({
    cellInfo: {
      name: 'test',
      version: '2.0.0',
      domain: 'test',
      endpoint: 'test:2',
      mountpoint: '',
      mitosis: {
        apoptosis: {
          versionConditions: []
        }
      }
    }
  })
  nginx.onCellApoptosisComplete({
    cellInfo: {
      name: 'test',
      version: '2.0.0'
    }
  })
  expect(nginx.startedCells.length).toBe(1)
  expect(nginx.updateNGINXTimeoutID).toBeDefined()
  await sleep(110)
  expect(nginx.updateNGINXTimeoutID).toBe(null)
})
