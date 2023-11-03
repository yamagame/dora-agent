#!/bin/sh
#
# RaspberryPi でロボットシステムを自動起動させるsystemdの設定を行う
#

cd `dirname $0`
sudo cp ../dora-agent.service /lib/systemd/system/
sudo systemctl enable dora-agent.service
# sudo service dora-agent start
