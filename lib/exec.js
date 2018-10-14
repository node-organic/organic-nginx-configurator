const {exec} = require('child_process')

module.exports = async function (cmd, options) {
  if (process.env.DRY) return console.info('[exec]', cmd)
  const child = exec(cmd, Object.assign({
    cwd: process.cwd(),
    env: process.env
  }, options))
  child.stdout.pipe(process.stdout)
  child.stderr.pipe(process.stderr)
  return new Promise((resolve, reject) => {
    child.on('close', (statusCode) => {
      if (statusCode === 0) return resolve(child)
      reject(new Error(cmd + ' [FAILED] ' + statusCode + ' code.'))
    })
  })
}
