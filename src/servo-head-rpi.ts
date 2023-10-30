import { CreateServo, CreateServoAction } from "./action"
import { ServoHeadBase } from "./servo-head"
const math = require("./math")
const raspi = require("raspi")
const pigpio = require("pigpio")

export function Start(confpath, config, callback) {
  const servoHead = new ServoHead(confpath, config)
  if (config.voiceHat) {
    pigpio.configureClock(5, 0)
  }
  raspi.init(() => {
    servoHead.startServo(config)
    servoHead.startButton(config)
    callback(servoHead)
  })
}

class ServoHead extends ServoHeadBase {
  buttonLevel = null
  button = null
  servo = null

  constructor(confpath, config) {
    super(confpath, config)
  }

  startServo(config) {
    const servo0 = CreateServo(this.setting.servo0) //UP DOWN
    const servo1 = CreateServo(this.setting.servo1) //LEFT RIGHT
    const servoAction = CreateServoAction(servo0, servo1)
    const led = require("./led-controller")()

    const { ServoPWM } = require("./servo-pwm")
    const servo = ServoPWM()
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
    this.servo = servo
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
    this.button = button
    return button
  }

  buttonRead() {
    return this.button.digitalRead()
  }
}
