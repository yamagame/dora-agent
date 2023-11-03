# コンテナから音の再生

ホストの Mac にサウンドのプロキシーである pulseaudio を使用してコンテナから音を再生できる。
下記に、手順を記す。

## ホスト側(mac)へpulseaudioをインストール

```sh
# pulseaudio のインストール
$ brew install pulseaudio

# pulseaudio のデーモン起動
$ pulseaudio --load=module-native-protocol-tcp --exit-idle-time=-1 --daemon

# 起動確認 Daemon running と表示されていることを確認
$ pulseaudio --check -v
W: [] caps.c: Normally all extra capabilities would be dropped now, but that s impossible because PulseAudio was built without capabilities support.
I: [] main.c: Daemon running as PID XXXXX

# module-native-protocol-tcp のロードを確認
$ pacmd list-modules | grep module-native-protocol-tcp
	name: <module-native-protocol-tcp>
```

以下のメッセージが出た場合は pulseaudio が正しく起動していない

```sh
E: [] main.c: pa_pid_file_create() failed.
```

エラーが発生した場合は下記コマンドでデーモンを再起動する。

```sh
# pluseaudio の再起動
$ pulseaudio -k && pulseaudio --load=module-native-protocol-tcp --exit-idle-time=-1 --daemon

# pulseaudio の起動を確認
$ pulseaudio --check -v
I: [] main.c: Daemon running as PID XXXXX
```

音を出力するスピーカーは以下のコマンドで変更できる。

```sh
# 出力デバイスの確認
$ pacmd list-sinks | grep -e 'name:' -e 'index:' -e device.string -e 'name:'
  * index: 0
      name: <Channel_1__Channel_2>
        device.string = "T09"
    index: 1
      name: <1__2>
        device.string = "MacBook Proのスピーカー"
    index: 2
      name: <Channel_1__Channel_2.2>
        device.string = "ZoomAudioDevice"

# 出力デバイスの変更
$ pacmd set-default-sink Channel_1__Channel_2
```

入力デバイスも sinks を source にして同様の方法で変更できる。

参考：[PulseAudio/サンプル](https://wiki.archlinux.jp/index.php/PulseAudio/%E3%82%B5%E3%83%B3%E3%83%97%E3%83%AB)

## コンテナ内から再生確認

```sh
# DialogSystem コンテナの起動&ログイン
$ docker-compose up -d dialog-system
$ docker-compose exec -it dialog-system bash
```

```sh
# 必要なパッケージをインストール
$ apt -y install pulseaudio libasound2 alsa-utils alsa-oss
```

```sh
# 環境変数を設定
$ export PULSE_SERVER=host.docker.internal
```

コンテナ内で以下のコマンドを実行しスピーカーが意図した選択になっているか確認する。

```sh
$ pactl list sinks | grep -e 'Sink' -e 'Name:' -e 'Description'
Sink #1
        Name: 1__2
        Description: MacBook Proのスピーカー
Sink #2
        Name: Channel_1__Channel_2.2
        Description: ZoomAudioDevice
Sink #13
        Name: Channel_1__Channel_2
        Description: T09

$ pactl info
Server String: host.docker.internal
Library Protocol Version: 34
Server Protocol Version: 34
Is Local: no
Client Index: 47
Tile Size: 65472
User Name: yamagame
Host Name: MacBookPro.local
Server Name: pulseaudio
Server Version: 14.2
Default Sample Specification: s16le 2ch 44100Hz
Default Channel Map: front-left,front-right
Default Sink: Channel_1__Channel_2  # <= 選択しているスピーカー
Default Source: Channel_1.2
Cookie: a097:0004
```

意図したスピーカーになっていない場合は以下のコマンドで変更する。

```sh
$ pactl list sinks | grep -e 'Sink' -e 'Name:' -e 'Description'
Sink #1
        Name: 1__2
        Description: MacBook Proのスピーカー
Sink #2
        Name: Channel_1__Channel_2.2
        Description: ZoomAudioDevice
Sink #13
        Name: Channel_1__Channel_2
        Description: T09

# スピーカーの選択
$ pactl set-default-sink 1  # <= ここでは「#1」に変更
```

サンプルサウンドの再生確認

```sh
# aplay コマンドで再生
$ aplay ./assets/audio/Pop.wav
```

## AquesTalkPi の再生

```sh
# 64bitOSの場合、以下のコマンドをコンテナ内で実行して32bitライブラリをインストールする
$ dpkg --add-architecture armhf
$ apt update
$ apt install libc6:armhf libstdc++6:armhf
```

```sh
# AquesTalkPi を aplay で再生（要AquesTalkPi）
$ ./AquesTalkPi -f test.txt | aplay
```

https://www.a-quest.com/products/aquestalkpi.html

※AquesTalkPi は個人、非営利は無償で利用可能。個人事業、会社や大学等で使用する場合は有償。
