let utils = require('utils');

var role = {
  run: function(creep) {
    if (!creep.memory.task) creep.memory.task = 'claim';

    // State change
    if (creep.memory.task === 'collect' && creep.carry.energy === creep.carryCapacity) {
      creep.memory.task = 'work';
      creep.memory.target = null;
    } else if (creep.memory.task === 'work' && creep.carry.energy === 0) {
      creep.memory.task = 'collect';
      creep.memory.source = null;
    }

    if (creep.memory.task === 'claim') {
      if (!creep.memory.target) {
        // let r = Game.getObjectById(creep.memory.init.flag).room;
        console.log("Find target to claim");
        var controllers = creep.room.find(FIND_STRUCTURES, {filter: (s) =>
          {return s.structureType == STRUCTURE_CONTROLLER && (!s.owner || !s.owner.username) }})
        if (controllers && controllers[0] && controllers[0].id) {
          creep.memory.target = controllers[0].id;
        }
      }

      if (creep.memory.target) {
        var t = Game.getObjectById(creep.memory.target);
        if (creep.claimController(t) == ERR_NOT_IN_RANGE) {
          creep.moveTo(t);
        }
      }
    } else { // work
    }
  }
};

module.exports = role;

// vim:syntax=javascript:expandtab:ts=2:sw=2
