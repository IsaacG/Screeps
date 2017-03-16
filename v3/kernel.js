LogBase = require('log_base');

class Kernel extends LogBase {
  constructor() {
    super();
    if (!Memory.kernel) Memory.kernel = {};
    this.m = Memory.kernel;
  }
  
  loop() {
    require('scheduler')(this);
  }

  shm(name) {
    if (!this.m.shm) this.m.shm = {};
    if (!this.m.shm[name]) this.m.shm[name] = {};
    return this.m.shm[name];
  }
}

module.exports.loop = function () {
  new Kernel().loop();
}

// vim:syntax=javascript:expandtab:ts=2:sw=2
