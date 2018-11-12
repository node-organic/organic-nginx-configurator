const fs = require('fs')
const ejs = require('ejs')
const exec = require('../lib/exec')
const StartedCells = require('../lib/started-cells')

module.exports = class {
  constructor (plasma, dna) {
    this.plasma = plasma
    this.dna = dna
    this.startedCells = new StartedCells()
    this.templatePromise = this.loadTemplate()
    plasma.on(dna.killOn || 'kill', () => {
      if (this.updateNGINXTimeoutID) {
        clearTimeout(this.updateNGINXTimeoutID)
      }
    })
    this.plasma.on('onCellMitosisComplete', this.onCellMitosisComplete, this)
    this.plasma.on('onCellApoptosisComplete', this.onCellApoptosisComplete, this)
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
  onCellMitosisComplete (c, next) {
    let cellInfo = c.cellInfo
    console.info('registering', cellInfo.name, cellInfo.version)
    this.startedCells.add(cellInfo)
    this.updateNGINX()
    next && next()
  }
  onCellApoptosisComplete (c, next) {
    this.startedCells.remove(c.cellInfo)
    this.updateNGINX()
    next && next()
  }
  updateNGINX () {
    if (this.updateNGINXTimeoutID) return
    if (!this.dna.nginxReloadInterval) return
    this.updateNGINXTimeoutID = setTimeout(async () => {
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
            back: 'http://' + generationId + '/'
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
