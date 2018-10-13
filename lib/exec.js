const {exec} = require('child_process')

module.exports = async function (cmd) {
  if (process.env.DRY) return console.info('[cmd]', cmd)
  const child = exec(cmd, {
    cwd: process.cwd(),
    env: process.env
  })
  child.stdout.pipe(process.stdout)
  child.stderr.pipe(process.stderr)
  return new Promise((resolve, reject) => {
    child.on('close', (statusCode) => {
      if (statusCode === 0) return resolve(child)
      reject(new Error(cmd + ' [FAILED] ' + statusCode + ' code.'))
    })
  })
}