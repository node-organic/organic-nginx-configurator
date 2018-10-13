const CELL_MODE = process.env.CELL_MODE

const path = require('path')
const Cell = require('organic-stem-cell')

let cellInstance = new Cell({
  dnaSourcePaths: [
    path.join(__dirname, 'dna')
  ],
  buildBranch: 'build',
  cellRoot: __dirname,
  defaultKillChemical: 'kill'
})
cellInstance.start(CELL_MODE)
