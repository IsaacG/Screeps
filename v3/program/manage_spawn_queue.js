Program = require('program/templates/base');


/* *****
 * Using a kernel-managed shared spawn queue,
 *  pop spawn requests from the queue and spawn them.
 * *****/
class ManageSpawnQueue extends Program {
  init() {
  }

  run(run_input) {
    this.info('Tick');
  }
}

module.exports = ManageSpawnQueue;

// vim:syntax=javascript:expandtab:ts=2:sw=2
