let utils = require('utils');

function getTarget (creep) {
  var targets = creep.room.find(FIND_STRUCTURES, {
    filter: (structure) => {
      return (structure.structureType == STRUCTURE_RAMPART ||
        structure.structureType == STRUCTURE_ROAD ||
        structure.structureType == STRUCTURE_CONTAINER ||
        structure.structureType == STRUCTURE_WALL) && structure.hits < structure.hitsMax;
    }
  });

  if(targets.length === 0) return null;

  var willDie = targets.filter((s) => {
    return (
      (s.structureType == STRUCTURE_RAMPART && s.hits < 15*RAMPART_DECAY_AMOUNT)
      || (s.structureType == STRUCTURE_ROAD && s.hits < 10*ROAD_DECAY_AMOUNT)
      || (s.structureType == STRUCTURE_CONTAINER && s.hits < 10*CONTAINER_DECAY)
    ); });
  if (willDie.length > 0) targets = willDie;

  targets.sort((a,b) => {
    return ((a.hits/a.hitsMax)/(a.structureType == STRUCTURE_RAMPART ? 7 : 1) - 
    (b.hits/b.hitsMax)/(b.structureType == STRUCTURE_RAMPART ? 7 : 1))});

  return targets[0].id;
}

var roleRepairer = {
  run: function(creep) {
    if (!creep.memory.task) creep.memory.task = 'collect';

    // State change
    if (creep.memory.task === 'collect' && creep.carry.energy === creep.carryCapacity) {
      creep.memory.task = 'repair';
      creep.memory.target = null;
    } else if (creep.memory.task === 'repair' && creep.carry.energy === 0) {
      creep.memory.task = 'collect';
      creep.memory.source = null;
    }


    if (creep.memory.task === 'collect') {
      utils.getEnergy(creep, false);
      return true;
    } else { // repair
      if (!creep.memory.target) creep.memory.target = getTarget(creep);
      if (!creep.memory.target) return false;
      let target = Game.getObjectById(creep.memory.target);

      if (!target || target.hits === target.hitsMax) {
        creep.memory.target = null;
        return true;
      }

      switch(creep.repair(target)) {
        case OK:
          break;
        case ERR_NOT_IN_RANGE:
          creep.moveTo(target);
          break;
        default:
          creep.memory.target = null;
          break;
      }
      return true;
    }
  }
};

module.exports = roleRepairer;

// vim:syntax=javascript:expandtab:ts=2:sw=2
