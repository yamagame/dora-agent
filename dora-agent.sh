#!/bin/bash
#
# ロボットエージェントプロセスを立ち上げる
#

cd `dirname $0`
source ~/.bashrc
npm run servo:sudo
