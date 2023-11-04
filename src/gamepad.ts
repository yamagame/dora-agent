const EventEmitter = require("events")
import * as HID from "node-hid"
import * as usbDetect from "usb-detection"

export function hexString(buf) {
  if (typeof buf === "number") {
    return buf.toString(16).toUpperCase()
  }
  return buf.toString("hex").toUpperCase()
}

export function dumpHex(buf) {
  const d = hexString(buf)
  const ret = []
  for (let i = 0; i < d.length; i += 2) {
    ret.push(d.substring(i, i + 2))
  }
  return ret
}

export function pad4(buf) {
  return ("0000" + hexString(buf)).slice(-4)
}

export function pad2(buf) {
  return ("0000" + hexString(buf)).slice(-2)
}

export class GamePad extends EventEmitter {
  constructor(deviceIds: string[]) {
    super()
    this.deviceIds = deviceIds
    this.devices = {}
    this.startMonitoring()
    this.timer = setInterval(() => {
      this.idle()
    }, 100)
  }

  startMonitoring() {
    if (this.usbDetect == null) {
      usbDetect.startMonitoring()

      usbDetect.on("add", (dev) => {
        const { vendorId, productId } = dev
        const d = `${pad4(vendorId)}:${pad4(productId)}`
        console.log(`add: ID:${d} deviceName:${dev.deviceName} manufacturer:${dev.manufacturer}`)
        this.add(vendorId, productId)
      })

      usbDetect.on("remove", (dev) => {
        const { vendorId, productId } = dev
        const d = `${pad4(vendorId)}:${pad4(productId)}`
        console.log(`remove: ID:${d} deviceName:${dev.deviceName} manufacturer:${dev.manufacturer}`)
        this.remove(vendorId, productId)
      })

      usbDetect.find((err, devices) => {
        if (!err) {
          devices.forEach((dev) => {
            const { vendorId, productId } = dev
            const d = `${pad4(vendorId)}:${pad4(productId)}`
            console.log(
              `add: ID:${d} deviceName:${dev.deviceName} manufacturer:${dev.manufacturer}`
            )
            this.add(vendorId, productId)
          })
        } else {
          console.error("error", err)
        }
      })

      this.usbDetect = usbDetect
    }
  }

  stopMonitoring() {
    if (this.usbDetect) {
      this.usbDetect.stopMonitoring()
    }
  }

  add(vendorId, productId) {
    setTimeout(() => {
      const d = `${pad4(vendorId)}:${pad4(productId)}`
      console.log(d)
      const hdi = HID.devices().find((hdi) => {
        return hdi.vendorId == vendorId && hdi.productId == productId
      })
      console.log("add", d)
      console.log("add", this.devices)
      console.log("add", hdi)
      if (hdi && this.devices[d] == null && this.deviceIds.indexOf(d) >= 0) {
        try {
          console.log("open", d)
          const device = new HID.HID(hdi.path)
          // device.on("data", (data) => {
          //   this.emit("event", { data, device_id: d })
          // })
          this.devices[d] = device
          console.log(Object.keys(this.devices))
        } catch (err) {
          console.error(err)
        }
      }
    }, 100)
  }

  remove(vendorId, productId) {
    try {
      const d = `${pad4(vendorId)}:${pad4(productId)}`
      console.log(`remove`, d)
      if (this.devices[d]) {
        console.log(`remove2`, d)
        // this.devices[d].removeAllListener()
        this.devices[d].pause()
        console.log(`remove3`, d)
        // setTimeout(() => {
        console.log(`remove4`, d)
        this.devices[d].close()
        console.log(`remove5`, d)
        delete this.devices[d]
        // }, 1000)
      }
    } catch (err) {
      console.error(err)
    }
  }

  close() {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = 0
    }
    console.log(`close`)
    this.stopMonitoring()
    Object.keys(this.devices).forEach((k) => {
      console.log(`close`, k)
      this.devices[k].close()
    })
    this.devices = []
  }

  idle() {
    Object.keys(this.devices).forEach((key) => {
      const dev = this.devices[key]
      const data = dev.readSync()
      this.emit("event", { data, device_id: key })
    })
  }
}

function main() {
  const deviceId = process.argv[2]
  const gamepad = new GamePad(deviceId.split(","))

  let state = {}
  gamepad.startMonitoring()

  process.on("exit", () => {
    console.log("exit")
    gamepad.close()
  })

  process.on("SIGINT", function () {
    console.log("Got SIGINT.  Press Control-D to exit.")
    gamepad.close()
  })

  gamepad.on("event", ({ data, device_id }) => {
    const bytes = data
    if (bytes && bytes.length > 5) {
      if (bytes[5] != state[device_id]) {
        state[device_id] = bytes[5]
        console.log(pad2(state[device_id]))
      }
    }
  })
}

if (require.main === module) {
  main()
}
