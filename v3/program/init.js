Program = require('program/templates/base');


/* *****
 * init is in charge of making sure a set of common management programs remain running always.
 * init never exits. It reaps children on death and respawns them.
 * *****/
class Init extends Program {
  init() {
    // For each room, launch a RoomWorkerManager to manage the basic workers in the room.
    // Launch a CreepSpawner process to roll creeps out from the queue.
    // Launch a MemoryCleaner to delete Memory.spawns for dead spawns.
    // Stats, diagnostics, logger daemon later.
    this.info('Initiliazing the init process.');

    // Launch a list of managers.
    // Managers are high level process that manage a top level object.
    // Global managers manage game-wide things.
    // Room managers work on a per-room basis.
    // Spawn managers work on spawns.
    this.m.managers = {
      global: {},
      room: {},
      spawn: {}
    }
    this.m.by_pid = {};

    runAllManagers();
  }

  // Run 'em all
  runAllManagers() {
    for (var m in ['manage_memory']) { runManager('global', m) };
    for (var m in []) { runManager('room', m) };
    for (var m in ['manage_spawn_queue']) { runManager('spawn', m) };
  }

  // Run manager programs, either once for global or for each room/spawn for those. Store the PID.
  runManager(level, program) {
    if (level === 'global') {
      if (!this.m.manager.[level][program]) {
        let pid = this.exec(program);
        this.m.manager.[level][program] = pid;
        this.m.by_pid[pid] = [level, program, null];
      }
    } else {
      var keys;
      if (level === 'room') {
        keys = Object.keys(Game.rooms);
      } else if (level === 'spawn') {
        keys = Object.keys(Game.spawns);
      } else {
        this.error('runManager: invalid level [' + level + ']');
        return;
      }
      for (var k in keys) {
        if (!this.m.managers[level][k]) this.m.managers[level][k] = {};
        if (!this.m.managers[level][k][program])) {
          let pid = this.exec(program, k);
          this.m.managers[level][k][program] = pid;
          this.m.by_pid[pid] = [level, program, k];
        }
      }
    }
  }

  /* *****
   * During initialization, we called runAllManagers() and everything should be up.
   * However, occasionally a new room/spawn/something may be added so we can periodically call it.
   * Most the work, though, is to restart programs if/when they die. So WAIT and launch.
   * Init never exits.
   *
   * Note: without some timeout mechanism, may never wake after a room/spawn is addded.
   * *****/
  run(syscall_result) {
    switch (syscall_result[0]) {
      case this.syscall.TICK:
        // Initial tick, start waiting-blocking.
        return [this.syscall.WAIT, true];

      case this.syscall.WAIT:
        // We got a WAIT reply; a child has died! syscall_result[1] === [pid, rc]
        var pid = syscall_result[1][0];
        var level = this.m.by_pid[pid][0];
        var program = this.m.by_pid[pid][1];
        var key = this.m.by_pid[pid][2];

        var new_pid;
        if (manager_info[0] === 'global') {
          new_pid = this.exec(program);
          this.m.managers[level][program] = new_pid;
        } else {
          new_pid = this.exec(program, key);
          this.m.managers[level][key][program] = new_pid;
        }
        this.m.by_pid[new_pid] = this.m.by_pid[pid];
        delete this.m.by_pid[pid];
        break;
    }
  }
}

module.exports = Init;

// vim:syntax=javascript:expandtab:ts=2:sw=2
