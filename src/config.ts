import * as fs from "fs"
import * as path from "path"

const basedir = process.env.ROBOT_BASE_DIR || "."

export const config = {
  basedir,
  voiceHat: (process.env.ROBOT_USB_VOICE_HAT || "true") === "true",
  gpioPort: process.env.ROBOT_GPIO_PORT || 3091,
  useGamePad: (process.env.ROBOT_USB_GAMEPAD || "false") === "true",
  credentialAccessControl: (process.env.ROBOT_CREDENTIAL_ACCESS_CONTROL || "false") === "true",
  localhostIPs: ["::1", "::ffff:127.0.0.1"],
}
