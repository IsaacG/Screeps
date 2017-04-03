/* Haul energy from drops/containers to spawn/extension/tower */
let utils = require('utils');

function getTarget (creep) {
  var targets = creep.room.find(FIND_STRUCTURES, {
    filter: (structure) => {
      return (((structure.structureType == STRUCTURE_EXTENSION ||
        structure.structureType == STRUCTURE_SPAWN ||
        structure.structureType == STRUCTURE_TOWER) && structure.energy < structure.energyCapacity) ||
        (structure.structureType == STRUCTURE_STORAGE && _.sum(structure.store) < structure.storeCapacity));
    }
  });
  if(targets.length > 0) {
    targets.sort((a,b)=>{return (a.energy/a.energyCapacity)-(b.energy/b.energyCapacity);});
    return targets[0].id;
  }
  return null;
}


var roleHauler = {
  run: function(creep) {
    if (!creep.memory.task) creep.memory.task = 'collect';

    // State change
    if (creep.memory.task === 'collect' && creep.carry.energy === creep.carryCapacity) {
      creep.memory.task = 'use';
      creep.memory.target = null;
    } else if (creep.memory.task === 'use' && creep.carry.energy === 0) {
      creep.memory.task = 'collect';
      creep.memory.source = null;
    }

    if (creep.memory.task === 'collect') {
      utils.getEnergy(creep, false);
    } else { // use
      if (!creep.memory.target) creep.memory.target = getTarget(creep);
      if (!creep.memory.target) return false;
      let target = Game.getObjectById(creep.memory.target);

      switch(creep.transfer(target, RESOURCE_ENERGY)) {
        case OK:
          break;
        case ERR_NOT_IN_RANGE:
          creep.moveTo(target);
          break;
        case ERR_FULL:
        case ERR_NOT_ENOUGH_RESOURCES:
          creep.memory.target = getTarget(creep);
          break;
      }
      return true;
    }
  }
};

module.exports = roleHauler;
// vim:syntax=javascript:expandtab:ts=2:sw=2
