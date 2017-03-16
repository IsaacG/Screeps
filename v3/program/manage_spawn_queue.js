Program = require('program/templates/base');


/* *****
 * Using a kernel-managed shared spawn queue,
 *  pop spawn requests from the queue and spawn them.
 * *****/
class ManageSpawnQueue extends Program {
  init() {
    let s = this.shm('spawn_queue');
    if (!s.q) s.q = [];
  }
  loop_init() {
    if (!this.queue) this.queue = this.shm('spawn_queue').q;
  }

  run(run_input) {
    this.info('Tick');
    if (this.queue.length !== 0) {
      this.info('Queued: ' + this.queue[0]);
      if ((Game.time % 5) === 0) {
        let creep = this.queue.shift();
        this.info('Shifted creep ' + creep + ' off the spawn queue for spawn ' + this.args)
      }
    }
  }
}

module.exports = ManageSpawnQueue;

// vim:syntax=javascript:expandtab:ts=2:sw=2
