Program = require('program/templates/base');


// Simple Echo writes args to Log and dies immediately.
class Echo extends Program {
  init() {
    this.m.runs = 0;
  }

  run(syscall_result) {
    this.Log('Echo: ');
    this.Log(this.m.args);
    return [this.syscall.EXIT, 5];
  }
}

module.exports = Echo;
// vim:syntax=javascript:expandtab:ts=2:sw=2
