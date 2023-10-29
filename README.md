# dora-engine / GPIO プロセス

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