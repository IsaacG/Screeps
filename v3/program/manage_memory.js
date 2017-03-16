Program = require('program/templates/base');


/* *****
 * Every so often, wipe out dead creeps from Memory.creeps.
 * *****/
class ManageMemory extends Program {
  init() {
  }

  run(run_input) {
    this.info('Tock');
  }
}

module.exports = ManageMemory;

// vim:syntax=javascript:expandtab:ts=2:sw=2
