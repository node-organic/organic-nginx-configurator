const fs = require('fs')
const path = require('path')
const exec = require('../lib/exec')

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
  angel.on('install :remote', (angel, next) => {
    let templatePath = path.resolve(__dirname, '../nginx.conf.ejs')
    angel.do('install ' + angel.cmdData.remote + ' ' + templatePath, next)
  })
  angel.on('install :remote :templatePath', async (angel, next) => {
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
        'npx --no-install angel register systemd service',
        'systemctl enable organic-nginx-configurator.service'
      ]
      await exec('ssh root@' + angel.cmdData.remote + ' \'' + setupCmds.join(' && ') + '\'')
      await exec(`scp ${angel.cmdData.templatePath} root@${angel.cmdData.remote}:${destPath}/nginx.conf.ejs`)
      await exec('ssh root@' + angel.cmdData.remote + ' \'systemctl start organic-nginx-configurator.service\'')
      await exec('ssh root@' + angel.cmdData.remote + ' \'systemctl restart organic-nginx-configurator.service\'')
      console.log('all done.')
      next && next()
    } catch (e) {
      console.error(e)
      next && next(e)
    }
  })
  angel.on('register systemd service', async (angel, next) => {
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

      [Install]
      WantedBy=multi-user.target`)
    } catch (err) {
      console.err(err)
      next && next(err)
    }
    next && next()
  })
}
const writeFile = function (filepath, content) {
  return new Promise((resolve, reject) => {
    fs.writeFile(filepath, content, (err) => {
      if (err) return reject(err)
      resolve()
    })
  })
}
