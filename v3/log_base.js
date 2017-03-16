class LogBase {

  constructor () {
    if (!Memory.log) Memory.log = {level: 1, klass: null, pid: -1};
    this.LVL = {
      DEBUG: [0, 'D'],
      INFO: [1, 'I'],
      WARNING: [2, 'W'],
      ERROR: [3, 'E'],
    }
    this.log_level = Memory.log.level;
    this.log_klass = Memory.log.klass;
    this.log_pid = Memory.log.pid;
  }

  log (level, msg) {
    if ((level[0] >= this.log_level) || this.constructor.name === this.log_klass) {
      console.log(`[${level[1]} ${this.constructor.name} K] ${msg}`)
    }
  }

  debug (msg) { this.log(this.LVL.DEBUG, msg) }
  info (msg) { this.log(this.LVL.INFO, msg) }
  warn (msg) { this.log(this.LVL.WARNING, msg) }
  error (msg) { this.log(this.LVL.ERROR, msg) }
}

module.exports = LogBase;
// vim:syntax=javascript:expandtab:ts=2:sw=2
