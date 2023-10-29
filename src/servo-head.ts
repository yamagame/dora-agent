import * as fs from "fs"
import { CreateServo, CreateServoAction } from "./action"
const math = require("./math")

function loadSetting(confpath) {
  try {
    return JSON.parse(fs.readFileSync(confpath, "utf8"))
  } catch (err) {}
  return {
    servo0: 0.073,
    servo1: 0.073,
  }
}

export function Start(confpath, config, callback) {
  const servoHead = new MockServoHead(confpath, config)
  callback(servoHead)
}

export class ServoHeadBase {
  mode = "idle"
  led_mode = "off"
  led_bright = 1
  servo0 = null
  servo1 = null
  setting = {}
  servoAction = null

  constructor(confpath, config) {
    this.setting = loadSetting(confpath)
    this.startServo(this.setting, config)
  }

  startServo(setting, config) {
    const servo0 = CreateServo(setting.servo0) //UP DOWN
    const servo1 = CreateServo(setting.servo1) //LEFT RIGHT
    const servoAction = CreateServoAction(servo0, servo1)
    const led = require("./led-controller")()
    setInterval(() => {
      servoAction.idle(this.mode)
      if (this.mode !== "talk") {
        led.resetTalk()
      }
      led.talk = math.abs(servo0.target - servo0.center)
      led.idle(this.led_mode, this.led_bright)
    }, 20)

    this.servo0 = servo0
    this.servo1 = servo1
    this.servoAction = servoAction
  }

  changeLed(payload) {
    if (payload.action === "off") {
      this.led_mode = "off"
    }
    if (payload.action === "on") {
      this.led_mode = "on"
    }
    if (payload.action === "blink") {
      this.led_mode = "blink"
    }
    if (payload.action === "talk") {
      this.led_mode = "talk"
    }
    if (payload.action === "power") {
      this.led_mode = "power"
    }
    if (payload.action === "active") {
      this.led_mode = "off"
    }
    if (payload.action === "deactive") {
      this.led_mode = "on"
    }
    this.led_bright = typeof payload.value !== "undefined" ? payload.value : this.led_bright
    //console.log(`led_mode ${led_mode} led_bright ${led_bright} `);
  }

  idle(direction) {
    this.servoAction.idle(this.mode)
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

  control(data, reset = false) {
    try {
      const p = JSON.parse(data)
      if (typeof p.v !== "undefined") {
        console.log(`vertical ${p.v}`)
        this.servo0.initialCenter = parseFloat(p.v)
        this.servo0.center = this.servo0.initialCenter
      }
      if (typeof p.h !== "undefined") {
        console.log(`horizontal ${p.h}`)
        this.servo1.initialCenter = parseFloat(p.h)
        this.servo1.center = this.servo1.initialCenter
      }
    } catch (err) {}
    if (reset) {
      this.servo0.initialCenter = 0.073
      this.servo0.center = this.servo0.initialCenter
      this.servo1.initialCenter = 0.073
      this.servo1.center = this.servo1.initialCenter
    }
    this.mode = "centering"
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
}

class MockServoHead extends ServoHeadBase {
  constructor(confpath, config) {
    super(confpath, config)
  }
  buttonRead() {
    return 0
  }
}
