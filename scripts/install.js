const loadDNAFn = require('organic-dna-loader')
const fs = require('fs')
const path = require('path')
const exec = require('../lib/exec')

module.exports = function (angel) {
  let destPath = '/home/root/organic-nginx-configurator'
  angel.on('install :remote', async (angel, next) => {
    try {
      let packagejson = require('../package.json')
      let installNodeCommand = [
        'git clone https://github.com/creationix/nvm.git ./.nvm || true',
        '. ./.nvm/nvm.sh',
        'nvm install ' + packagejson.engines.node
      ].join(' && ')
      let installCmds = [
        'apt-get update',
        'apt-get -y install git build-essential nginx ',
        'mkdir -p ' + destPath,
        'cd ' + destPath,
        'git clone ' + packagejson.repo + ' .',
        installNodeCommand,
        'npm i',
        'npx --no-install angel install as daemon',
        'service organic-nginx-configurator start'
      ]
      await exec('ssh root@' + angel.cmdData.remote + ' \'' + installCmds.join(' && ') + '\'')
      let dna = await loadDNA()
      if (dna.cells && dna.cells['organic-nginx-configurator']) {
        await exec(`scp ./cells/dna/organic-nginx-configurator.json:${destPath}/dna/_production.json`)
        let templatePath = getTemplatePath(dna)
        if (templatePath) {
          await exec(`scp ${templatePath}:${destPath}/${templatePath}`)
        }
      }
      await exec('ssh root@' + angel.cmdData.remote + '\'service organic-nginx-configurator restart\'')
      next && next()
    } catch (e) {
      console.error(e)
      next && next(e)
    }
  })
  angel.on('install as daemon', async (angel, next) => {
    await writeFile('/etc/init/organic-nginx-configurator.conf', `
    start on filesystem and started networking
    respawn
    chdir ${destPath}
    exec bash scripts/daemon.sh ${destPath} ${packagejson.engines.node}`)
    next && next()
  })
}

const getTemplatePath = function (dna) {
  let path = 'cells.organic-nginx-configurator.build.nginx-config.templatePath'
  try {
    return selectBranch(dna, path)
  } catch (e) {
    return
  }
}
const writeFile = function (filepath, content) {
  return new Promise((resolve, reject) => {
    fs.writeFile(filepath, content, (err) => {
      if (err) return reject(err)
      resolve()
    })
  })
}
const loadDNA = async function () {
  // do not load own DNA
  if (process.cwd() === path.basename(__dirname)) return Promise.resolve({})
  return new Promise((resolve, reject) => {
    loadDNAFn((err, dna) => {
      if (err) return reject(err)
      resolve(dna)
    })
  })
}
