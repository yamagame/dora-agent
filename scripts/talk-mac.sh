#!/bin/bash
#
# sayコマンド(mac用) を使って発話する
#

SPEECH_TEXT=$1
V_VOICE_ID=$2
R_RATE=$3 # word per minute

say $V_VOICE_ID $R_RATE $SPEECH_TEXT
