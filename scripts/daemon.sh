#!/bin/bash

. ./.nvm/nvm.sh
nvm use $1
CELL_MODE=_production node index.js
