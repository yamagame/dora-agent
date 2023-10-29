import * as fs from "fs"
import { Servo, Action } from "./action"
const raspi = require("raspi")
const math = require("math")
const pigpio = require("pigpio")

function loadSetting(confpath) {
  try {
    return JSON.parse(fs.readFileSync(confpath, "utf8"))
  } catch (err) {}
  return {
    servo0: 0.073,
    servo1: 0.073,
  }
}

export function StartMockServoHead(confpath, config, callback) {
  const servoHead = new MockServoHead(confpath, config)
  callback(servoHead)
}

export function StartServoHead(confpath, config, callback) {
  const servoHead = new ServoHead(confpath, config)
  if (config.voiceHat) {
    pigpio.configureClock(5, 0)
  }
  raspi.init(callback(this))
}

class ServoHeadBase {
  led_mode = "off"
  led_bright = 1
  setting = {}

  constructor(confpath, config) {
    this.setting = loadSetting(confpath)
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
  saveSetting(confpath) {
    const data = {
      ...this.setting,
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
  idle(direction) {}
  control(data, reset = false) {}
  centering(callback) {
    callback()
  }
}

class ServoHead extends ServoHeadBase {
  mode = "idle"
  buttonLevel = null
  servo0 = null
  servo1 = null
  servoAction = null
  button = null

  constructor(confpath, config) {
    super(confpath, config)
    this.startServo(this.setting, config)
    this.button = this.startButton(config)
  }

  startServo(setting, config) {
    const servo0 = Servo(setting.servo0) //UP DOWN
    const servo1 = Servo(setting.servo1) //LEFT RIGHT
    const servoAction = Action(servo0, servo1)

    const { ServoPWM } = require("./servo-pwm")
    const servo = ServoPWM()
    const led = require("./led-controller")()
    servo.pwm0.write(servo0.now) //UP DOWN
    servo.pwm1.write(servo1.now) //LEFT RIGHT
    if (config.voiceHat) {
      servo.pwm2.write(led.now)
    } else {
      servo.pwm2.write(led.max - led.now)
    }
    servo0.on("updated", () => {
      servo.pwm0.write(math.roundParam(servo0.now))
    })
    servo1.on("updated", () => {
      servo.pwm1.write(math.roundParam(servo1.now))
    })
    led.on("updated", () => {
      if (config.voiceHat) {
        servo.pwm2.write(led.now)
      } else {
        servo.pwm2.write(led.max - led.now)
      }
    })
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

  startButton(config) {
    const Gpio = require("pigpio").Gpio
    const button = new Gpio(23, {
      mode: Gpio.INPUT,
      pullUpDown: Gpio.PUD_DOWN,
      edge: Gpio.EITHER_EDGE,
    })
    // button.on("interrupt", function (level) {
    //   if (!config.voiceHat) level = 1 - level
    //   if (this.buttonLevel != level) {
    //     this.buttonLevel = level
    //   }
    // })
    return button
  }

  buttonRead() {
    return this.button.digitalRead()
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
