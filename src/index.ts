import * as path from "path"
import * as ServoHead from "./servo-head"
import { LedMode } from "./led-controller"
const { config } = require("./config")
const { Speech, VoiceMode } = require("./speech")
import { ServoMode } from "./action"

function main() {
  const { basedir, voiceMode } = config
  const confpath = path.join(basedir, "servo-head.json")

  ServoHead.Start(confpath, config, (servoHead: ServoHead.ServoHeadBase) => {
    const speech = new Speech()

    servoHead.mode = (process.env.MODE as ServoMode) || ServoMode.idle
    servoHead.led_mode = (process.env.LED_MODE as LedMode) || LedMode.off
    servoHead.led_bright = parseInt(process.env.LED_VALUE) || 1

    const PORT = config.gpioPort
    const app = require("http").createServer(handler)
    const io = require("socket.io")(app)

    function requestHandler(req, callback) {
      let buf = Buffer.from([])
      req.on("data", (data) => {
        buf = Buffer.concat([buf, data])
      })
      req.on("close", () => {})
      req.on("end", () => {
        callback(buf.toString())
      })
    }

    async function say(text: string) {
      return new Promise((resolve, rejected) => {
        try {
          servoHead.mode = ServoMode.centering
          servoHead.centering(async () => {
            speech.params.speechMode = VoiceMode(voiceMode)
            const mode = servoHead.mode
            servoHead.mode = ServoMode.talk
            await speech.play(text)
            servoHead.mode = ServoMode.idle
            resolve(0)
          })
        } catch {
          rejected()
        }
      })
    }

    function handler(req, res) {
      if (req.method === "POST") {
        const url = require("url").parse(req.url)
        const params = require("querystring").parse(url.search)
        req.params = params

        // curl -X POST http://localhost:3091/reset
        if (url.pathname === "/reset") {
          return requestHandler(req, (data) => {
            servoHead.reset()
            res.end("OK\n")
          })
        }

        // curl -X POST -d '{"h":100,"v":200}' http://localhost:3091/center
        if (url.pathname === "/center") {
          return requestHandler(req, (data) => {
            servoHead.control(JSON.parse(data))
            res.end("OK\n")
          })
        }

        // curl -X POST http://localhost:3091/stop
        if (url.pathname === "/stop") {
          return requestHandler(req, (data) => {
            servoHead.mode = ServoMode.stop
            res.end("OK\n")
          })
        }

        // curl -X POST http://localhost:3091/idle
        if (url.pathname === "/idle") {
          return requestHandler(req, (data) => {
            servoHead.mode = ServoMode.idle
            res.end("OK\n")
          })
        }

        // curl -X POST http://localhost:3091/talk
        if (url.pathname === "/talk") {
          return requestHandler(req, (data) => {
            servoHead.mode = ServoMode.talk
            res.end("OK\n")
          })
        }

        // curl -X POST http://localhost:3091/save
        if (url.pathname === "/save") {
          return requestHandler(req, (data) => {
            servoHead.saveSetting(path.join(basedir, "servo-head.json"))
            res.end("OK\n")
          })
        }

        // curl -X POST http://localhost:3091/exit
        if (url.pathname === "/exit") {
          return requestHandler(req, (data) => {
            servoHead.mode = ServoMode.exit
            servoHead.led_mode = LedMode.off
            setTimeout(() => {
              res.end("OK\n", () => {
                console.log("exit")
                process.exit(0)
              })
            }, 3000)
          })
        }

        // curl -X POST http://localhost:3091/button/on
        if (url.pathname === "/button/on") {
          return requestHandler(req, (data) => {
            io.emit("button", { level: 0, state: true })
            res.end("OK\n")
          })
        }

        // curl -X POST http://localhost:3091/button/off
        if (url.pathname === "/button/off") {
          return requestHandler(req, (data) => {
            io.emit("button", { level: 1, state: false })
            res.end("OK\n")
          })
        }

        // curl -X POST -d '{"text":"こんにちは"}' http://localhost:3091/utterance
        if (url.pathname === "/utterance") {
          return requestHandler(req, async (data) => {
            try {
              const { text } = JSON.parse(data)
              await say(text)
              res.end("OK\n")
            } catch {
              res.end("ERR\n")
            }
          })
        }

        // curl -X POST http://localhost:3091/utterance/stop
        if (url.pathname === "/utterance/stop") {
          return requestHandler(req, async (data) => {
            speech.stop()
            res.end("OK\n")
          })
        }

        // curl -X POST -d '{"mode":"on"}' http://localhost:3091/led
        if (url.pathname === "/led") {
          return requestHandler(req, async (data) => {
            try {
              const { mode } = JSON.parse(data)
              servoHead.led_mode = mode
              res.end("OK\n")
            } catch {
              res.end("ERR\n")
            }
          })
        }
      }
      res.end()
    }

    app.listen(PORT, () => {
      console.log(`servo-head listening on port ${PORT}!`)
    })

    io.on("connection", function (socket) {
      console.log("connected", socket.id, socket.handshake.address)
      if (config.credentialAccessControl) {
        if (config.localhostIPs.indexOf(socket.handshake.address) === -1) {
          console.log("permission denied")
          return
        }
      }
      console.log("start action")

      socket.on("led-command", (payload, callback) => {
        servoHead.changeLed(payload)
        if (callback) callback()
      })

      socket.on("disconnect", function () {
        console.log("disconnect")
      })

      socket.on("utterance", async function (payload, callback) {
        console.log("utterance")
        try {
          const { text } = payload
          await say(text)
        } catch {}
        if (callback) callback()
      })

      socket.on("message", function (payload, callback) {
        if (servoHead.mode === ServoMode.exit) {
          if (callback) callback()
          return
        }
        try {
          const { action, direction } = payload
          if (action === "centering") {
            servoHead.mode = ServoMode.centering
          } else if (action === "talk" || action === "idle" || action === "stop") {
            servoHead.mode = action
            if (direction) {
              servoHead.idle(direction)
            }
          } else if (
            action === "led-on" ||
            action === "led-off" ||
            action === "led-blink" ||
            action === "led-talk"
          ) {
            servoHead.led_mode = action.toString().split("-")[1]
            servoHead.led_bright = 1
          }
          if (callback) {
            if (action === "centering") {
              //首が正面を向くまで待つ
              servoHead.centering(() => {
                callback({ action })
              })
            } else {
              callback({ action })
            }
          }
        } catch (err) {
          if (callback) callback()
        }
      })

      socket.on("gamepad", (payload, callback) => {
        if (config.useGamePad) {
          const { action, vendorId, productId } = payload
          if (action === "add") {
            servoHead.gamepad.add(vendorId, productId)
          }
          if (action === "remove") {
            servoHead.gamepad.remove(vendorId, productId)
          }
        }
        if (callback) callback()
      })
    })

    setInterval(() => {
      let level = servoHead.buttonRead()
      if (!config.voiceHat) level = 1 - level
      if (servoHead.buttonLevel != level) {
        servoHead.buttonLevel = level
        io.emit("button", { level: level, state: level == 0 })
      }
    }, 100)

    if (config.useGamePad) {
      servoHead.gamepad.on("event", (event) => {
        io.emit("gamepad", event)
      })
    }
  })
}

if (require.main === module) {
  main()
}
