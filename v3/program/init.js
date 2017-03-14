Program = require('program/templates/base');

class Init extends Program {
  init() {
    this.m.runs = 0;
  }

  run(syscall_result) {
    this.Log('Init, tick: ' + this.m.runs);

    switch(this.m.runs++) {
      case 0:
        this.Log('This is Init speaking. First time.');
        break;
      case 1:
        this.Log('Init will now run: echo foo bar');
        return [this.syscall.EXEC, ['echo', 'foo', 'bar']];
      case 2:
        this.Log('Child pid: ' + syscall_result[1]);
        this.Log('Init will gain run: echo foo bar');
        return [this.syscall.EXEC, ['echo', 'foo', 'bar']];
        break;
      case 3:
        this.Log('Child pid: ' + syscall_result[1]);
        this.Log('init: wait for child (should be quick).');
        return [this.syscall.WAIT, null];
      case 4:
        this.Log('Child,rc = ' + syscall_result[1]);
        return [this.syscall.WAIT, null];
      case 5:
        this.Log('Child,rc = ' + syscall_result[1]);
        this.Log('Init will once run: echo_sleep foo bar');
        return [this.syscall.EXEC, ['echo_sleep', 'foo bar']];
      case 6:
        this.Log('Child pid: ' + syscall_result[1]);
        this.Log('Init will twice run: echo_sleep foo bar');
        return [this.syscall.EXEC, ['echo_sleep', 'foo bar']];
        break;
      case 7:
        this.Log('Child pid: ' + syscall_result[1]);
        break;
      case 8:
        this.Log('init: wait for child A (should be slow).');
        return [this.syscall.WAIT, null];
      case 9:
        this.Log('Child,rc = ' + syscall_result[1]);
        break;
      case 10:
        this.Log('init: wait for child B (should be slow).');
        return [this.syscall.WAIT, null];
      case 11:
        this.Log('Child,rc = ' + syscall_result[1]);
        break;
      case 12:
        this.Log('Time to die');
        return [this.syscall.EXIT, 123];
        break;
      default:
        this.Log('Default? Noooooo!')
    }
  }
}

module.exports = Init;
// vim:syntax=javascript:expandtab:ts=2:sw=2
