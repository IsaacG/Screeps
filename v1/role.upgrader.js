let utils = require('utils');

var roleUpgrader = {
  run: function(creep) {
    if (!creep.memory.task) creep.memory.task = 'collect';

    // State change
    if (creep.memory.task === 'collect' && creep.carry.energy === creep.carryCapacity) {
      creep.memory.task = 'work';
    } else if (creep.memory.task === 'work' && creep.carry.energy === 0) {
      creep.memory.task = 'collect';
      creep.memory.source = null;
    }

    if (creep.memory.task === 'collect') {
      utils.getEnergy(creep, true);
    } else { // work
      if(creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE)
        creep.moveTo(creep.room.controller, {visualizePathStyle: {stroke: '#ffffff'}});
    }
    return true;
  }
};

module.exports = roleUpgrader;

// vim:syntax=javascript:expandtab:ts=2:sw=2
