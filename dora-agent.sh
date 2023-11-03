#!/bin/bash
#
# ロボットエージェントプロセスを立ち上げる
#

cd `dirname $0`
source ~/.bashrc
node -v >> dora-agnet.log
yarn servo:sudo >> dora-agent.log
