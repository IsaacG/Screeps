LogBase = require('log_base');

class Kernel extends LogBase {
  constructor () {
    super();
    if (!Memory.kernel) Memory.kernel = {};
    this.m = Memory.kernel;
  }
  
  loop() {
    require('scheduler')(this);
  }
}

module.exports.loop = function () {
  new Kernel().loop();
}

// vim:syntax=javascript:expandtab:ts=2:sw=2
