Program = require('program/templates/base');


/* *****
 * Every so often, wipe out dead creeps from Memory.creeps.
 * *****/
class ManageMemory extends Program {
  init() {
  }

  run(run_input) {
    this.info('Tock');
    if ((Game.time % 50) === 0) {
      for (var name in Memory.creeps) {
        if (!Game.creeps[name]) delete Memory.creeps[name];
      }
    }
  }
}

module.exports = ManageMemory;

// vim:syntax=javascript:expandtab:ts=2:sw=2
