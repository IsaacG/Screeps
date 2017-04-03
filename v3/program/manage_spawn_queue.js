Program = require('program/templates/base');

/* *****
 * Using a kernel-managed shared spawn queue,
 *  pop spawn requests from the queue and spawn them.
 * *****/

const STATE_POLL = 0;
const STATE_SPAWNING = 1;

class ManageSpawnQueue extends Program {
  init() {
    let s = this.shm('spawn_queue');
    if (!s.q) s.q = [];
    if (!s.out) s.out = {};
    this.m.state = STATE_POLL;
    this.m.req_pid = 0;
  }
  setup() {
    this.spawn_name = this.args;
    if (!this.queue) this.queue = this.shm('spawn_queue').q;
    if (!this.out) this.out = this.shm('spawn_queue').out;
  }

  run(run_input) {
    this.info('Tick');
    switch (this.m.state) {
      case STATE_POLL:
        if (this.queue.length !== 0) {
          let spawn = Game.spawns[this.spawn_name];
          if (spawn.canCreateCreep(this.queue[0][1])) {
            let spawn_req = this.queue.shift();
            let pid = spawn_req[0];
            let parts = spawn_req[1];
            let mem = spawn_req[2];
            let rc = spawn.createCreep(parts, null, mem);
            if (typeof(rc) === "string") {
              this.m.name = rc;
              this.m.state = STATE_SPAWNING;
              this.m.req_pid = pid;
              this.info(`Spawned creep for ${pid}: ${rc}`);
            } else {
              this.warn(`Failed to spawn creep. Got error code ${rc}`);
              // Don't unshift. No point.
            }
          }
        }
        break;
      case STATE_SPAWNING:
        // Would be nice to process sleep for this.spawn.spawning.remainingTime
        let spawn = Game.spawns[this.spawn_name];
        if (!spawn.spawning) {
          this.out[this.m.req_pid] = this.m.name;
          this.m.state = STATE_POLL;
          this.info('Spawning done');
        }
        break;
    }
  }
}

module.exports = ManageSpawnQueue;

// vim:syntax=javascript:expandtab:ts=2:sw=2
