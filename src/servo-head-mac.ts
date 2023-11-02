import { ServoHeadBase } from "./servo-head"

export function Start(confpath, config, callback) {
  const servoHead = new MockServoHead(confpath, config)
  servoHead.startServo(config)
  callback(servoHead)
}

class MockServoHead extends ServoHeadBase {
  constructor(confpath, config) {
    super(confpath, config)
  }

  buttonRead() {
    return -1
  }
}
