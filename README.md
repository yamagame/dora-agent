# dora-agent

ラズパイでコミュニケーションロボットを動かすためのプロセス

- 発話処理
  - OpenJTalk
  - AquesTalkPi
  - Siri(Sayコマンド) Macのみ
- 首振り制御
  - 上下
  - 左右
- LEDボタン制御

## 準備

以下の作業は、ラズパイOSで行う。

```sh
# 以下、nodejsのインストール
$ sudo apt update && sudo apt upgrade -y
$ sudo apt -y install nodejs npm
$ curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
$ source ~/.bashrc
$ nvm install lts/hydrogen
$ nvm use lts/hydrogen
$ npm install -g npm
$ npm install -g yarn

# OpenJTalk のインストール
$ ./scripts/setup-rpi-openjtalk.sh

# node_modules をインストール
$ yarn install # または npm install
$ yarn build
$ yarn servo:sudo # または npm run servo:sudo
```

## MAX98357A D級アンプ を使用して音声出力する

### /boot/config.txt を編集する

以下の項目をコメントアウトして無効化します。

```
dtparam=audio=on
```

以下の３項目を記入して有効化します。

```
dtparam=i2s=on
dtoverlay=i2s-mmap
dtoverlay=googlevoicehat-soundcard
```

### /etc/asound.conf を作成

```
options snd_rpi_googlemihat_soundcard index=0

pcm.softvol {
    type softvol
    slave.pcm dmix
    control {
        name Master
        card 0
    }
}

pcm.micboost {
    type route
    slave.pcm dsnoop
    ttable {
        0.0 10
        1.1 10
    }
}

pcm.!default {
    type asym
    playback.pcm "plug:softvol"
    capture.pcm "plug:micboost"
}

ctl.!default {
    type hw
    card 0
}
```

### 再生の確認

以下のコマンドを実行してスピーカーから音がでるか確認する。

```sh
$ aplay ./assets/audio/Pop.wav
```

音が大きいときは以下のコマンドでボリュームの調整ができる。

```sh
$ alsamixer
```

## 自動起動設定

下記スクリプトを実行し再起動する。

```sh
$ ./scripts/setup-autolaunch.sh
```

AquesTalkPi に変更したいときは、dora-agent.sh を編集し再起動する。

```sh
#!/bin/bash
#
# ロボットエージェントプロセスを立ち上げる
#

cd `dirname $0`
source ~/.bashrc
npm run servo:aquest  # <= ここを変更する
```

サービスの再起動

```sh
$ sudo service dora-agent restart
```

## socket.io イベント

- led-command LED点灯モード変更イベント
  - off
  - on
  - blink
  - talk
  - power
  - active
  - deactive

- utterance 発話処理

- message 首振りモード変更イベント
  - centering
  - talk
  - idle
  - stop
  - led-on
  - led-off
  - led-blink
  - led-talk

- gamepad ゲームパッド接続イベント（内部で使用）
  - add
  - remove

- button ボタン押下イベント

## POST リクエスト

  - /center
  - /reset
  - /stop
  - /idle
  - /talk
  - /save
  - /exit
  - /utterance
  - /utterance/stop
