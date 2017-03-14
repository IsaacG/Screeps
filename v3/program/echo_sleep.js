Program = require('program/templates/base');


// Sleep, echo, sleep, die. For testing.
class EchoSleep extends Program {
  init() {
    this.m.runs = 0;
  }

  run(syscall_result) {
    switch(this.m.runs++) {
      case 0:
        this.Log('EchoSleep: step0 = sleep');
        return;
      case 1:
        this.Log('EchoSleep: step1 = o/ echoing: ' + this.m.args);
        return;
      case 2:
        this.Log('EchoSleep: step2 = sleep more');
        return;
      case 5:
        this.Log('EchoSleep: step3 = finally die');
        return [this.syscall.EXIT, 7];
    }
  }
}

module.exports = EchoSleep;
// vim:syntax=javascript:expandtab:ts=2:sw=2
