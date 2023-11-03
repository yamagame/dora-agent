import * as platform from "./platform"
import { spawn } from "child_process"

export function execPowerOff() {
  if (platform.isRaspi()) {
    const _playone = spawn("/usr/bin/sudo", ["shutdown", "-f", "now"])
    _playone.on("close", function (code) {
      console.log("shutdown done")
    })
  } else {
    process.exit(0)
  }
}
