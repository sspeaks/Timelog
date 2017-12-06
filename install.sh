#!/bin/bash
PWD=$(pwd)
TFILE=$(cat timelog.sh)
NEWTL=${TFILE//R_DIR/$PWD}
echo "$NEWTL" > /usr/local/bin/timelog
sudo chmod +x /usr/local/bin/timelog

