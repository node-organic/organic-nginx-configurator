const fs = require('fs')
const ejs = require('ejs')
const exec = require('../lib/exec')
const path = require('path')
const semverDiff = require('semver-diff')

module.exports = class {
  constructor (plasma, dna) {
    this.plasma = plasma
    this.dna = dna
    this.templatePromise = this.loadTemplate()
    this.startedCells = []
    try {
      if (this.dna.store && this.dna.store.endsWith('.json')) {
        this.startedCells = require(path.join(process.cwd(), this.dna.store))
      }
    } catch (e) {}
    if (dna.channel) {
      this.plasma.on({
        type: 'control',
        channel: dna.channel.name
      }, this.handleChemical, this)
    }
    plasma.on(dna.killOn || 'kill', () => {
      if (this.updateNGINXTimeoutID) {
        clearTimeout(this.updateNGINXTimeoutID)
      }
    })
  }
  async loadTemplate () {
    let promise = new Promise((resolve, reject) => {
      fs.readFile(this.dna.templatePath, (err, data) => {
        if (err) return reject(err)
        console.info('template loaded...')
        resolve(data.toString())
      })
    })
    return promise
  }
  handleChemical (c, next) {
    if (!this[c.action]) return next(new Error(c.action + ' action not found'))
    this[c.action](c, next)
  }

  setTemplate (c) {
    this.templatePromise = Promise.resolve(c.template)
  }
  onCellMitosisComplete (c, next) {
    console.info('registering', c.cellInfo.name, c.cellInfo.version)
    this.flushLegacyCells(c.cellInfo)
    this.startedCells.push(c.cellInfo)
    this.updateNGINX()
    next && next()
  }
  flushLegacyCells (cellInfo) {
    for (let i = 0; i < this.startedCells.length; i++) {
      let legacy_cell = this.startedCells[i]
      if (legacy_cell.name === cellInfo.name &&
        is_version_legacy(legacy_cell.mitosis.apoptosis.versionConditions, legacy_cell.version, cellInfo.version)) {
        this.startedCells.splice(i, 1)
        i -= 1
      }
    }
  }
  onCellApoptosisComplete (c, next) {
    for (let i = 0; i < this.startedCells.length; i++) {
      if (this.startedCells[i].name === c.cellInfo.name &&
        this.startedCells[i].version === c.cellInfo.version) {
        this.startedCells.splice(i, 1)
        i -= 1
        this.updateNGINX()
      }
    }
    next && next()
  }
  updateNGINX () {
    if (this.updateNGINXTimeoutID) return
    if (!this.dna.nginxReloadInterval) return
    this.updateNGINXTimeoutID = setTimeout(async () => {
      if (this.dna.store && this.dna.store.endsWith('.json')) {
        await writeFile(path.join(process.cwd(), this.dna.store), JSON.stringify(this.startedCells))
      }
      this.updateNGINXTimeoutID = null
      this.templatePromise.then(async (template) => {
        await writeFile(this.dna.configPath, ejs.render(template, {
          upstreams: this.getUpstreams(),
          servers: this.getServersAndLocations()
        }))
        await exec('systemctl reload nginx')
        console.info('nginx conf updated')
      }).catch((err) => {
        console.error(err)
      })
    }, this.dna.nginxReloadInterval)
  }
  getUpstreams () {
    /** returns [{
      name: String,
      servers: [{
        endpoint: String
      }]
    }] */
    let upstreams_hash = {}
    for (let i = 0; i < this.startedCells.length; i++) {
      let cell = this.startedCells[i]
      if (cell.endpoint.indexOf('/') === 0) {
        continue // filesystem cells doesnt have upstream
      }
      let generationId = get_generation_id(cell)
      if (!upstreams_hash[generationId]) {
        upstreams_hash[generationId] = {
          name: generationId,
          servers: []
        }
      }
      upstreams_hash[generationId].servers.push({
        endpoint: cell.endpoint
      })
    }
    return hash_to_arr(upstreams_hash)
  }
  getServersAndLocations () {
    let servers_hash = {}
    for (let i = 0; i < this.startedCells.length; i++) {
      let cell = this.startedCells[i]
      if (!servers_hash[cell.domain]) {
        servers_hash[cell.domain] = {
          port: 80,
          name: cell.domain,
          locations: [],
          locations_hash: {}
        }
      }
      let locations_hash = servers_hash[cell.domain].locations_hash
      let generationId = get_generation_id(cell)
      if (cell.endpoint.indexOf('/') === 0) {
        if (!locations_hash[generationId]) {
          // set location only once per generation
          locations_hash[generationId] = {
            front: cell.mountpoint,
            files: cell.endpoint
          }
        }
      } else {
        if (!locations_hash[generationId]) {
          // set location only once per generation
          locations_hash[generationId] = {
            front: cell.mountpoint,
            back: '@' + generationId
          }
        }
      }
    }
    for (let key in servers_hash) {
      servers_hash[key].locations = hash_to_arr(servers_hash[key].locations_hash)
      delete servers_hash[key].locations_hash
    }
    return hash_to_arr(servers_hash)
  }
}

const writeFile = function (filepath, content) {
  return new Promise((resolve, reject) => {
    if (process.env.DRY) return console.info('[write]', filepath, '...')
    fs.writeFile(filepath, content, (err) => {
      if (err) return reject(err)
      resolve()
    })
  })
}

const hash_to_arr = function (hash) {
  let result = []
  for (let key in hash) {
    result.push(hash[key])
  }
  return result
}

const get_generation_id = function (cell) {
  return cell.name + cell.version
}

const is_version_legacy = function (versionConditions, existing_version, new_version) {
  let diffValue = semverDiff(existing_version, new_version)
  return versionConditions.indexOf(diffValue) !== -1
}
