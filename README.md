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
