import * as fs from "fs"
import { CreateServo, CreateServoAction, ServoMode } from "./action"
import { LedMode, LedController } from "./led-controller"
const math = require("./math")
const { execSync } = require("child_process")
const { config } = require("./config")

const gamepad = config.useGamePad ? require("./gamepad") : null

export const Start = function (...params) {
  const arch = (() => {
    try {
      return execSync("cat /proc/device-tree/model")
    } catch {}
    return ""
  })()
  let ServoHead = null
  if (arch.toString().startsWith("Raspberry Pi")) {
    ServoHead = require("./servo-head-rpi")
  } else {
    ServoHead = require("./servo-head-mac")
  }
  return ServoHead.Start(params[0], params[1], params[2])
}

function loadSetting(confpath) {
  try {
    return JSON.parse(fs.readFileSync(confpath, "utf8"))
  } catch (err) {}
  return {
    servo0: 0.073,
    servo1: 0.073,
  }
}

export class ServoHeadBase {
  _mode: ServoMode = ServoMode.idle
  _led_mode: LedMode = LedMode.off
  _led_bright = 1
  gamepad = gamepad
  servo0 = null
  servo1 = null
  setting = {
    servo0: 0.073,
    servo1: 0.073,
  }
  servoAction = null
  buttonLevel = null

  constructor(confpath, config) {
    this.setting = loadSetting(confpath)
  }

  set mode(mode: ServoMode) {
    this._mode = mode
  }

  get mode(): ServoMode {
    return this._mode
  }

  set led_mode(mode) {
    this._led_mode = mode
  }

  get led_mode() {
    return this._led_mode
  }

  set led_bright(bright) {
    this._led_bright = bright
  }

  get led_bright() {
    return this._led_bright
  }

  startServo(config) {
    const servo0 = CreateServo(this.setting.servo0) //UP DOWN
    const servo1 = CreateServo(this.setting.servo1) //LEFT RIGHT
    const servoAction = CreateServoAction(servo0, servo1)
    const led = new LedController()

    setInterval(() => {
      servoAction.idle(this._mode)
      if (this._mode !== "talk") {
        led.resetTalk()
      }
      led.talk = math.abs(servo0.target - servo0.center)
      led.idle(this._led_mode, this._led_bright)
    }, 20)

    this.servo0 = servo0
    this.servo1 = servo1
    this.servoAction = servoAction
  }

  changeLed(payload) {
    if (payload.action === "off") {
      this._led_mode = LedMode.off
    }
    if (payload.action === "on") {
      this._led_mode = LedMode.on
    }
    if (payload.action === "blink") {
      this._led_mode = LedMode.blink
    }
    if (payload.action === "talk") {
      this._led_mode = LedMode.talk
    }
    if (payload.action === "power") {
      this._led_mode = LedMode.power
    }
    if (payload.action === "active") {
      this._led_mode = LedMode.off
    }
    if (payload.action === "deactive") {
      this._led_mode = LedMode.on
    }
    this._led_bright = typeof payload.value !== "undefined" ? payload.value : this._led_bright
    //console.log(`led_mode ${led_mode} led_bright ${led_bright} `);
  }

  idle(direction) {
    this.servoAction.idle(this._mode)
  }

  centering(callback) {
    //首が正面を向くまで待つ
    const change = (state) => {
      if (state === "ready") {
        callback()
        this.servoAction.removeListener("centering", change)
      }
    }
    this.servoAction.on("centering", change)
  }

  reset() {
    this.servo0.initialCenter = 0.073
    this.servo0.center = this.servo0.initialCenter
    this.servo1.initialCenter = 0.073
    this.servo1.center = this.servo1.initialCenter
    this._mode = ServoMode.centering
  }

  control(data: { v: number; h: number }) {
    try {
      const p = data
      if (typeof p.v !== "undefined") {
        console.log(`vertical ${p.v}`)
        this.servo0.initialCenter = p.v
        this.servo0.center = this.servo0.initialCenter
      }
      if (typeof p.h !== "undefined") {
        console.log(`horizontal ${p.h}`)
        this.servo1.initialCenter = p.h
        this.servo1.center = this.servo1.initialCenter
      }
    } catch (err) {}
    this._mode = ServoMode.centering
  }

  saveSetting(confpath) {
    const data = {
      ...this.setting,
      servo0: this.servo0.initialCenter,
      servo1: this.servo1.initialCenter,
    }
    try {
      fs.writeFileSync(confpath, JSON.stringify(data))
    } catch (err) {}
  }

  buttonRead() {
    return 0
  }
}
