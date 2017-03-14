/* *****
 * Base Program template.
 *
 * Gets constructed with memory.
 * run() takes a [SYSCALL, args] and returns a [SYSCALL, args]
 * *****/

class Program {
  constructor (m){
    this.m = m;
    this.Log = require('logging').Log;
    this.syscall = require('consts').syscall;
    if (!this.m.called_init) {
      this.init();
      this.m.called_init = true;
    }
  }

  runner(syscall_result) {
    let result = this.run(syscall_result);
    if (!result) result = [this.syscall.TICK, null];

    return result;
  }

  init() {};
  run(syscall_result) {};
}

module.exports = Program;

// vim:syntax=javascript:expandtab:ts=2:sw=2
