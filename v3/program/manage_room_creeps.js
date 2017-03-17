Program = require('program/templates/base');


/* *****
 *
 * *****/
class ManageRoomCreeps extends Program {
  init() {
    // Track creeps dedicated to running this room.
    this.m.room_creeps = {}
  }

  loop_init() {
    this.room = this.args;
    if (!this.queue) this.queue = this.shm('spawn_queue').q;
    if (!this.out) this.out = this.shm('spawn_queue').out;
  }

  // To spawn creep, we exec a spawn_creep {args}, transition to WAITING and WAIT on it
  // When spawn_creep dies, that process will hand us a creep name.
  // However, WAIT can return when an existing creep_role died :(
  // Use non-block wait(pid) future-feature?
  // We can then use the creep name to exec creep_role {name:name}
  // Loop on creation. When nothing left to create, we can do into a WAIT-loop to regen.

  addCreep(role) {
    let rc = this.exec('creep_' + role);
    let pid = rc[0];
    this.m.room_creeps[pid] = role;
  }

  creepDied(pid) {
  }

  run(run_input) {
    // Run even N ticks?
    // Spin up a bunch of creeps.
    // Poll for death and recreate on death.
    let room = Game.rooms[this.room];
    // Filter creeps based on room and/or based on room_creeps.
    if ((Game.time % 3) == 0) {
      this.queue.push([this.pid, [MOVE, CARRY, WORK], null]);
    }
    if (this.out && this.pid in this.out) {
      this.info(`Spawn ${this.out[this.pid]} was created for us!`);
      delete this.out[this.pid];
    }
  }
}

module.exports = ManageRoomCreeps;

// vim:syntax=javascript:expandtab:ts=2:sw=2
