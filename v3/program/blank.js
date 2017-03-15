Program = require('program/templates/base');


/* *****
 * Program description here.
 * *****/
class ProgramName extends Program {
  init() {
    // initialize
  }

  run(syscall_result) {
    // Do stuff

    // Die
    return [this.syscall.EXIT, 0];
  }
}

module.exports = ProgramName;

// vim:syntax=javascript:expandtab:ts=2:sw=2
