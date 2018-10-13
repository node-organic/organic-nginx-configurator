const fs = require('fs')
const ejs = require('ejs')

const writeFile = function (filepath, content) {
  return new Promise((resolve, reject) => {
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

const get_generation_id = function (cellInfo) {
  return cell.name + cell.type
}

module.exports = class {
  constructor (plasma, dna) {
    this.plasma = plasma
    this.dna = dna
    this.templatePromise = this.loadTemplate()
    this.plasma.on(dna.channel.name, this.handleChemical, this)
    this.plasma.on(dna.channel.onReadyType, this.broadcastReannonce, this)
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
  broadcastReannonce (c){
    console.info('ready, broadcasting reannonce request after 5 sec...')
    setTimeout(() => {
      this.plasma.emit({
        type: this.dna.channel.emitReannonceType,
        channel: this.dna.channel.name
      })
      console.info('reannonce request broadcasted.')
    }, 5 * 1000)
  }
  
  setTemplate (c) {
    this.templatePromise = Promise.resolve(c.template)
  }
  onCellStarting (c) {
    this.startedCells.push(c.cellInfo)
    this.updateNGINX()
  }
  onCellAnnoncing (c) {
    this.startedCells.push(c.cellInfo)
    this.updateNGINX()
  }
  onCellStopping (c) {
    for (let i = 0; i < this.startedCells.length; i++) {
      let hasSameName = this.startedCells[i].name === c.cellInfo.name
      let hasSameVersion = this.startedCells[i].version === c.cellInfo.version
      if (hasSameName && hasSameVersion) {
        this.startedCells.splice(i, 1)
        i -= 1
        this.updateNGINX()
      }
    }
  }
  updateNGINX () {
    if (this.updateNGINXTimeoutID) return
    this.updateNGINXTimeoutID = setTimeout(() => {
      this.templatePromise.then(async (template) => {
        await writeFile(thid.dna.nginx.configPath, ejs.render(template, {
          upstreams: this.getUpstreams(),
          servers: this.getServersAndLocations()
        }))
        await exec('nginx reload')
      }).catch((err) => {
        console.error(err)
      })
    }, this.dna.timeoutInterval)
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
        upstreams_hash[generationId] = {name: generationId}
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
      if (!servers_hash[cell.domain]) servers_hash[cell.domain] = {
        port: 80,
        name: cell.domain,
        locations: [],
        locations_hash: {}
      }
      let locations_hash = servers_hash[cell.domain]
      let generationId = get_generation_id(cell)
      if (cell.endpoint.indexOf('/') === 0) {
        if (!locations_hash[generationId]) {
          locations_hash[generationId] = {
            front: cell.mountpoint,
            files: cell.endpoint
          }
        }
      } else {
        if (!locations_hash[generationId]) {
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