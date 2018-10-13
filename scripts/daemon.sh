#!/bin/bash

. $1/.nvm/nvm.sh
nvm use $2
cd $1
CELL_MODE=_production node $1/index.js