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

pigpio は nodejs 14.X.X でビルドする必要がある。yarn install は nodejs 14.X.X で行うこと。

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
