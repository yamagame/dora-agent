#!/bin/bash
#
# 64bit RaspberryPi OS で AquasTalkPi を使用するための準備を行う
#

sudo dpkg --add-architecture armhf
sudo apt update
sudo apt install libc6:armhf libstdc++6:armhf
