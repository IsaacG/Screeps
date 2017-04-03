/* *****
 * Base Program template.
 *
 * Gets constructed with memory.
 * run() takes a [SYSCALL, args] and returns a [SYSCALL, args]
 * *****/

LogBase = require('log_base');

class Program extends LogBase {
  constructor(m, kernel) {
    super();
    this.m = m;
    this.kernel = kernel;
    this.args = m.args;
    this.pid = m.pid;
    this.children = {};

    this.syscall = require('consts').syscall;
    if (!this.m.called_init) {
      this.init();
      this.m.called_init = true;
    }
    this.setup();
  }

  log (level, msg) {
    if ((level[0] >= this.log_level) || this.constructor.name === this.log_klass || this.pid == this.log_pid) {
      console.log(`[${level[1]} ${this.constructor.name} ${this.pid}] ${msg}`)
    }
  }

  runner(syscall_result) {
    let result = this.run(syscall_result);
    if (!result) result = [this.syscall.TICK, null];

    return result;
  }

  // Run a child program, return the PID
  exec(program, args) {
    return this.kernel.scheduler.exec(this.pid, program, args);
  }

  // Run a child program. Wait for it to finish and return the RC.
  exec_wait(program, args) {
  }

  // Get some shared memory via the kernel.
  shm(name) {
    if (!name) name = this.constructor.name;
    return this.kernel.shm(name);
  }

  setup() {};
  init() {};
  run(syscall_result) {};
}

module.exports = Program;

// vim:syntax=javascript:expandtab:ts=2:sw=2
