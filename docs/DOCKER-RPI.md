# RaspiOS を Mac 上の Docker で動作させる手順

下記に、最新の Raspbian から Docker イメージを作成し、DialogSystem を起動するまでの手順を記述する。
イメージの作成のホストは M1 Mac を使用した。

## raspios_lite イメージの作成

```sh
# RaspiOS のイメージを公式サイトからダウンロード
$ curl -o ./work/2023-10-10-raspios-bookworm-arm64-lite.img.xz https://downloads.raspberrypi.org/raspios_lite_arm64/images/raspios_lite_arm64-2023-10-10/2023-10-10-raspios-bookworm-arm64-lite.img.xz
# または、https://www.raspberrypi.com/software/operating-systems/ からダウンロード

# ハッシュの確認
$ openssl sha1 ./work/2023-10-10-raspios-bookworm-arm64-lite.img.xz
SHA1(./work/2023-10-10-raspios-bookworm-arm64-lite.img.xz)= 4c199fa3e154f7a3abe86e8f9d26adbeb3d0227a

# xzファイルを解凍
$ xz -d ./work/2023-10-10-raspios-bookworm-arm64-lite.img.xz

# 作業用のコンテナを起動する
$ docker run -it --rm -v ./work:/app --privileged --entrypoint /bin/bash ubuntu

# parted コマンドがインストールされてなければインストール
$ apt-get update && apt-get install --yes --no-install-recommends parted

# parted を使用して ext4 パーティションの先頭を調べる
$ parted /app/2023-10-10-raspios-bookworm-arm64-lite.img unit B print
Model:  (file)
Disk /app/2023-10-10-raspios-bookworm-arm64-lite.img: 2722103296B
Sector size (logical/physical): 512B/512B
Partition Table: msdos
Disk Flags: 

Number  Start       End          Size         Type     File system  Flags
 1      4194304B    541065215B   536870912B   primary  fat32        lba
 2      541065216B  2722103295B  2181038080B  primary  ext4

# マウントするディレクトリを作成
$ mkdir --parents /mnt/image

# この例では、541065216 なので、offset に 541065216B を設定して /mnt/image にマウントする
$ mount --options loop,offset=541065216 /app/2023-10-10-raspios-bookworm-arm64-lite.img /mnt/image
$ ls -l /mnt/image
      :
      :
      :
      :

# マウントしたディレクトリを tar 
$ tar cfv /app/2023-10-10-raspios-bookworm-arm64-lite.tar -C /mnt/image .

# コンテナから exit
$ exit

# ルートファイルシステムをimageとしてインポート
$ docker image import ./work/2023-10-10-raspios-bookworm-arm64-lite.tar raspios_lite_arm64:2023-10-10

# コンテナを起動
$ docker run -it --rm -w /app --entrypoint -p 7005:7005 /bin/bash raspios_lite_arm64:2023-10-10

# OSのバージョンを確認
$ lsb_release -a
No LSB modules are available.
Distributor ID: Debian
Description:    Debian GNU/Linux 12 (bookworm)
Release:        12
Codename:       bookworm
```

## Nodejs のインストール

```sh
$ apt -y install nodejs npm
$ curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
$ source ~/.bashrc
$ nvm install 18.17.0
$ nvm use 18.17.0
$ npm install -g npm
$ npm install -g yarn
```

## 稼働中のコンテナからイメージを作成

```sh
# 別のターミナルで稼働中のコンテナIDを調べる
$ docker container ps
CONTAINER ID   IMAGE                            COMMAND       CREATED          STATUS          PORTS    NAMES
953b55869913   raspios_lite_arm64:2023-10-10    "/bin/bash"   22 minutes ago   Up 22 minutes            practical_ride
       :
       :
       :

# コンテナIDからイメージを作成
$ docker commit 953b55869913 raspios_dialog_system
sha256:b400a056e9b6e2d39e4f6153d99304ebd66c6d421acdc882bfa76273e8c12484

# 作成したイメージの確認
$ docker image list | grep raspios_dialog_system
raspios_dialog_system     latest     b400a056e9b6   19 seconds ago   5.56GB
$ 
```

## コンテナの起動

一度イメージを作れば、次回から以下のコマンドで DialogSystem を起動することができる

```sh
$ docker run -it --rm -v ./:/app -v ~/.config/pulse:/root/.config/pulse -p 7005:7005 -w /app --entrypoint /bin/bash raspios_dialog_system
$ ./scripts/start-dialog-system.sh
```
