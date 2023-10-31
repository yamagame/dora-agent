#!/bin/bash
#
# OpenJTalk を使って発話する
#

TMP=./work/open-jtalk.wav
SPEECH_TEXT=$1
VOICE_NAME=$2
if [ -z "$VOICE_NAME" ]; then
  VOICE_NAME=mei_normal
fi
ALL_VOICE_PATH=`find ./ -name *"$VOICE_NAME"*.htsvoice`
# echo $ALL_VOICE_PATH
for var in $ALL_VOICE_PATH
do
    VOICE_PATH="$var"
    echo $VOICE_PATH
    break
done
echo "$SPEECH_TEXT" | open_jtalk \
-m $VOICE_PATH \
-x "/var/lib/mecab/dic/open-jtalk/naist-jdic/" \
-ow $TMP
aplay $TMP
