import { EventEmitter } from "events"
import { spawn, ChildProcess } from "child_process"
import * as path from "path"
import { config } from "./config"
import * as platform from "./platform"
const utils = require("./pskiller")

const { basedir } = config

export enum SpeechMode {
  Dummy = "dummy",
  Mac = "mac",
  OpenJTalk = "open-jtalk",
  Aquestalk = "aquestalk",
}

export function VoiceMode(voiceMode: string): SpeechMode {
  switch (voiceMode) {
    case "":
    case "default":
      if (platform.isRaspi()) {
        return SpeechMode.OpenJTalk
      }
      if (platform.isDarwin()) {
        return SpeechMode.Mac
      }
      break
    case "mac":
    case "siri":
    case "say":
      return SpeechMode.Mac
    case "aquest":
    case "aquestalk":
      return SpeechMode.Aquestalk
    case "openjtalk":
    case "open-jtalk":
      return SpeechMode.OpenJTalk
  }
  return SpeechMode.Dummy
}

export class SppechInternalParam {
  speechMode: SpeechMode = SpeechMode.Mac
  constructor() {}
}

export class Speech extends EventEmitter {
  playQue: any[] = []
  playing: boolean = false
  params = new SppechInternalParam()
  playtask?: ChildProcess

  constructor() {
    super()
  }

  // playQueから一つ取り出して発話
  async _playone() {
    return new Promise((resolve) => {
      const speechMode = this.params.speechMode

      if (this.playQue.length <= 0 || this.playing === false) {
        this.playtask = null
        resolve(0)
        return
      }

      const text = this.playQue.shift()
      if (text == "") {
        resolve(0)
        return
      }

      console.log(`${speechMode}:`, text)
      switch (speechMode) {
        case SpeechMode.Dummy:
          resolve(0)
          break
        case SpeechMode.OpenJTalk:
          this.emit("play-start")
          this.playtask = spawn(path.join(basedir, "scripts", "talk-openjtalk.sh"), [`${text}`])
          this.playtask.on("close", (code) => {
            resolve(0)
          })
          break
        case SpeechMode.Aquestalk:
          this.emit("play-start")
          this.playtask = spawn(path.join(basedir, "scripts", "talk-aquestalk.sh"), [`${text}`])
          this.playtask.on("close", (code) => {
            resolve(0)
          })
          break
        case SpeechMode.Mac:
          this.emit("play-start")
          this.playtask = spawn(path.join(basedir, "scripts", "talk-mac.sh"), [`${text}`])
          this.playtask.on("close", (code) => {
            resolve(0)
          })
          break
        default:
          resolve(0)
          break
      }
    })
  }

  // 発話セット
  async play(words) {
    this.emit("talk")

    const speechMode = this.params.speechMode
    const conts = ((speechMode) => {
      switch (speechMode) {
        case SpeechMode.Mac:
          return words.split(/\n|。|@|＠|？|\?/g)
        case SpeechMode.Aquestalk:
          return words.split(/\n|,|。|@|＠|？|\s|\?/g)
        default:
          return [words]
      }
    })(speechMode)

    this.playQue.push(...conts)

    if (!this.playing) {
      this.playing = true
      while (this.playQue.length > 0) {
        await this._playone()
      }
      this.playing = false
    } else {
      await this.playwait()
    }
  }

  // 再生終了まで待つ
  async playwait() {
    return new Promise((resolve) => {
      const timer = setInterval(() => {
        if (this.playQue.length === 0) {
          clearInterval(timer)
          resolve(0)
        }
      }, 100)
    })
  }

  // 発話の強制停止
  stop() {
    this.playQue = []
    this.playing = false
    if (this.playtask) {
      utils.kill(this.playtask.pid, "SIGTERM", function () {})
    }
    this.playtask = null
  }

  flush() {
    this.playing = false
    this.playQue = []
  }
}

function main() {
  const speech = new Speech()
  speech.params.speechMode = SpeechMode.Aquestalk
  speech.play("こんにちは。私は段ボール頭のおしゃべりロボです。どうぞよろしくお願いいたします。")
}

if (require.main === module) {
  main()
}
