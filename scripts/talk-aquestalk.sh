#!/bin/bash
#
# AquesTalkPi を使って発話する
#

SPEECH_TEXT=$1
V_VOICE_ID=$2 # f1 or f2
S_SPEED=$3 # 50-300 (default:100)
G_VOLUME=$4 # 0-100 (default:100)

./work/aquestalkpi/AquesTalkPi $V_VOICE_ID $S_SPEED $G_VOLUME $SPEECH_TEXT | aplay
