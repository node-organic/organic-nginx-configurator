const loadDNAFn = require('organic-dna-loader')
const fs = require('fs')
const path = require('path')
const exec = require('../lib/exec')
const {selectBranch} = require('organic-dna-branches')

module.exports = function (angel) {
  let destPath = '/home/root/organic-nginx-configurator'
  let packPath = './dist/deployment.tar.gz'
  const packCurrent = async () => {
    let excludes = [
      `--exclude='./.git*'`,
      `--exclude='./dist*'`,
      `--exclude='./node_modules*'`,
      `--exclude='./coverage*'`,
      `--exclude='./__tests__*'`
    ]
    let tarCmd = `tar ${excludes.join(' ')} -zcvf ${packPath} .`
    return exec(tarCmd)
  }
  angel.on('install :remote', async (angel, next) => {
    try {
      await exec('mkdir -p ./dist')
      await packCurrent()
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
        installNodeCommand
      ]
      await exec('ssh root@' + angel.cmdData.remote + ' \'' + installCmds.join(' && ') + '\'')
      await exec('scp ' + packPath + ' root@' + angel.cmdData.remote + ':' + destPath + '/deployment.tar.gz')
      let setupCmds = [
        'cd ' + destPath,
        'tar -zxf deployment.tar.gz',
        '. ./.nvm/nvm.sh',
        'nvm use ' + packagejson.engines.node,
        'npm i',
        'npx --no-install angel install as daemon',
        'systemctl enable organic-nginx-configurator.service'
      ]
      await exec('ssh root@' + angel.cmdData.remote + ' \'' + setupCmds.join(' && ') + '\'')
      let dna = await loadDNA()
      if (dna.cells && dna.cells['organic-nginx-configurator']) {
        await exec(`scp ./cells/dna/organic-nginx-configurator.json root@${angel.cmdData.remote}:${destPath}/dna/_production.json`)
        let templatePath = getTemplatePath(dna)
        if (templatePath) {
          await exec(`scp ${templatePath} root@${angel.cmdData.remote}:${destPath}/${templatePath}`)
        }
      }
      await exec('ssh root@' + angel.cmdData.remote + ' \'systemctl start organic-nginx-configurator.service\'')
      await exec('ssh root@' + angel.cmdData.remote + ' \'systemctl restart organic-nginx-configurator.service\'')
      console.log('all done.')
      next && next()
    } catch (e) {
      console.error(e)
      next && next(e)
    }
  })
  angel.on('install as daemon', async (angel, next) => {
    let packagejson = require('../package.json')
    try {
      await writeFile('/etc/systemd/system/organic-nginx-configurator.service', `
      [Unit]
      Description=organic nginx configurator
      # Requires=After=nginx.service

      [Service]
      ExecStart=/bin/bash /home/root/organic-nginx-configurator/scripts/daemon.sh ${packagejson.engines.node}
      # Required on some systems
      WorkingDirectory=${destPath}
      Restart=always
      # Restart service after 10 seconds if node service crashes
      RestartSec=10
      # Output to syslog
      StandardOutput=syslog
      StandardError=syslog
      SyslogIdentifier=organic-nginx-configurator
      Environment=CELL_MODE=_production

      [Install]
      WantedBy=multi-user.target`)
    } catch (err) {
      console.err(err)
      next && next(err)
    }
    next && next()
  })
}

const getTemplatePath = function (dna) {
  let path = 'cells.organic-nginx-configurator.build.nginx-config.templatePath'
  try {
    return selectBranch(dna, path)
  } catch (e) {
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
  if (process.cwd() === path.relative(__dirname, '../')) return Promise.resolve({})
  return new Promise((resolve, reject) => {
    loadDNAFn((err, dna) => {
      if (err) return reject(err)
      resolve(dna)
    })
  })
}
