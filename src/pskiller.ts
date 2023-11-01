const psTree = require("ps-tree")

export function kill(pid, signal, callback) {
  signal = signal || "SIGKILL"
  callback = callback || function () {}
  let killTree = true
  if (killTree) {
    psTree(pid, function (err, children) {
      ;[pid]
        .concat(
          children.map(function (p) {
            return p.PID
          })
        )
        .forEach(function (tpid) {
          try {
            process.kill(tpid, signal)
          } catch (ex) {}
        })
      callback()
    })
  } else {
    try {
      process.kill(pid, signal)
    } catch (ex) {}
    callback()
  }
}
