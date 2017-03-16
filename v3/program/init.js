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

    this.runAllManagers();
  }

  // Run 'em all
  runAllManagers() {
    ['manage_memory'].forEach((m) => this.runManager('global', m) );
    ['manage_room_creeps'].forEach((m) => this.runManager('room', m) );
    ['manage_spawn_queue'].forEach((m) => this.runManager('spawn', m) );
  }

  // Run manager programs, either once for global or for each room/spawn for those. Store the PID.
  runManager(level, program) {
    if (level === 'global') {
      if (!this.m.managers[level][program]) {
        let pid = this.exec(program);
        this.m.managers[level][program] = pid;
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
      keys.forEach((k) => {
        if (!this.m.managers[level][k]) this.m.managers[level][k] = {};
        if (!this.m.managers[level][k][program]) {
          let pid = this.exec(program, k);
          this.info(`For ${level} ${k} run ${program}:${pid}`);
          this.m.managers[level][k][program] = pid;
          this.m.by_pid[pid] = [level, program, k];
        }
      });
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
        if (!(syscall_result[1])) {
          this.error('run: WAIT returned with no results. No children?!');
          return;
        }
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
        return [this.syscall.WAIT, true];
    }
  }
}

module.exports = Init;

// vim:syntax=javascript:expandtab:ts=2:sw=2
