#!/bin/bash

. @{1}/.nvm/nvm.sh
nvm use @{2}
CELL_MODE=_production node @{1}/index.js