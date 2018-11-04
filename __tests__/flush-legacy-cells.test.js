const fs = require('fs')
const path = require('path')
const Plasma = require('organic-plasma')
const NginxOrganelle = require('../organelles/nginx-config')

const nginxDNA = {
  'channel': false,
  'templatePath': './nginx.conf.ejs',
  'nginxReloadInterval': false,
  'configPath': false,
  'store': false
}

beforeAll(() => {
  process.env.DRY = 1
})
afterAll(() => {
  delete process.env.DRY
})

test('flush legacy cells on major new version', async () => {
  let nginx = new NginxOrganelle(new Plasma(), nginxDNA)
  expect(nginx.startedCells.length).toBe(0)
  nginx.startedCells = [
    {
      name: 'test',
      version: '1.0.0',
      mitosis: {
        apoptosis: {
          versionConditions: ['major']
        }
      }
    }
  ]
  nginx.flushLegacyCells({
    name: 'test',
    version: '2.0.0'
  })
  expect(nginx.startedCells.length).toBe(0)
})

test('flush legacy cells only on minor new version', async () => {
  let nginx = new NginxOrganelle(new Plasma(), nginxDNA)
  expect(nginx.startedCells.length).toBe(0)
  nginx.startedCells = [
    {
      name: 'test',
      version: '1.0.0',
      mitosis: {
        apoptosis: {
          versionConditions: ['minor']
        }
      }
    }
  ]
  nginx.flushLegacyCells({
    name: 'test',
    version: '2.0.0'
  })
  expect(nginx.startedCells.length).toBe(1)
  nginx.flushLegacyCells({
    name: 'test',
    version: '1.0.1'
  })
  expect(nginx.startedCells.length).toBe(1)
  nginx.flushLegacyCells({
    name: 'test',
    version: '1.1.0'
  })
  expect(nginx.startedCells.length).toBe(0)
})

test('flush legacy cells only on build new version', async () => {
  let nginx = new NginxOrganelle(new Plasma(), nginxDNA)
  expect(nginx.startedCells.length).toBe(0)
  nginx.startedCells = [
    {
      name: 'test',
      version: '1.0.0-featureA+1',
      mitosis: {
        apoptosis: {
          versionConditions: ['build']
        }
      }
    }
  ]
  nginx.flushLegacyCells({
    name: 'test',
    version: '2.0.0'
  })
  expect(nginx.startedCells.length).toBe(1)
  nginx.flushLegacyCells({
    name: 'test',
    version: '1.0.1'
  })
  expect(nginx.startedCells.length).toBe(1)
  nginx.flushLegacyCells({
    name: 'test',
    version: '1.1.0'
  })
  expect(nginx.startedCells.length).toBe(1)
  nginx.flushLegacyCells({
    name: 'test',
    version: '1.0.0-featureB+1',
  })
  expect(nginx.startedCells.length).toBe(1)
  nginx.flushLegacyCells({
    name: 'test',
    version: '1.0.0-featureA+2',
  })
  expect(nginx.startedCells.length).toBe(0)
})
