/* *****
 * Spawn a creep for a job.
 *
 * Makes use of some shared memory library call to get access to the build queue and results.
 *
 * Takes a list of body parts and a priority.
 * Push the creep to a singleton build queue (with the PID).
 * Poll the creepBuilder's output for my PID.
 * When the builder is done building my creep (by PID), return the creep ID to the caller.
 * *****/

Program = require('program/templates/base');

class SpawnCreep extends Program {
  init() {
    this.spawn_request = this.args;
    if (!this.queue) this.queue = this.shm('spawn_queue').q;
    this.queue.push([this.pid, this.spawn_request.parts, this.spawn_request.mem]);
  }
  
  run(run_input) {
    let out = this.shm('spawn_queue').out;
    if (out && this.pid in out) {
      let creep_name = out[this.pid];
      this.info(`Creep ${creep_name} was created for us!`);
      delete out[this.pid];
      return [this.syscall.EXIT, spawn_name];
    }
  }
}

// vim:syntax=javascript:expandtab:ts=2:sw=2
