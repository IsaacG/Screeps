Program = require('program/templates/base');


/* *****
 * Different types of creeps.
 * - Statics: give a target (harvest, upgrade). find spot near target, ideally on container. do work. one MOVE, one CARRY. All WORK.
 * - Haulers: CARRY and MOVE. Get resources from mines to elsewhere.
 * - Workers: get energy. figure out what work needs doing (repair, collect energy, build, upgrade). Do it.
 * 
 * 
 * 
 * *****/
class ManageRoomCreeps extends Program {
  init() {
    // Track creeps dedicated to running this room.
    this.m.room_creeps = {};
    this.m.spawning = {};
  }

  setup() {
    this.room = this.args;
  }

  // To spawn creep, we exec a spawn_creep {args}, transition to WAITING and WAIT on it
  // When spawn_creep dies, that process will hand us a creep name.
  // However, WAIT can return when an existing creep_role died :(
  // Use non-block wait(pid) future-feature?
  // We can then use the creep name to exec creep_role {name:name}
  // Loop on creation. When nothing left to create, we can do into a WAIT-loop to regen.

  addCreep(role) {
    let rc = this.exec('spawn_creep', parts);
    let pid = rc[0];
    this.m.spawning[pid] = role;
  }

  run(run_input) {
    let room = Game.rooms[this.room];
    if (tick) {
      cleanUpDeadCreeps();
      getJobs();
      addCreeps();
      runStaticCreeps();
      runHaulers();
      runWorkers();
    } else if (WAIT) {
      reap creep
      add to worker queue
    }
  }

  /* *****
   * If a creep no longer exists, delete it from the list of workers.
   * Maybe create a new one? Or not.
   * *****/
  cleanUpDeadCreeps () {
  }

  /* *****
   * Compute what work needs to be done. Used to assign and build creeps. Priorities.
   * *****/
  getJobs () {
  }

  /* *****
   * Add creeps as needed.
   * Harvester if no static harvester plus hauler.
   * One harvester per source plus hauler.
   * 2-3 upgraders until static.
   * Builder if count(construction site) / N > builders
   * Repairer if anything under 75%
   * Works with getJobs()
   * *****/
  addCreeps () {
  }

  /* *****
   * For static workers, move and work.
   * *****/
  runStaticCreeps () {
  }

  /* *****
   * Pickup, drop off.
   * *****/
  runHaulers () {
  }

  /* *****
   * Get energy. Assign to a task with it. Build, repair, fill, upgrade.
   * *****/
  runWorkers () {
  }
}

module.exports = ManageRoomCreeps;

// vim:syntax=javascript:expandtab:ts=2:sw=2
