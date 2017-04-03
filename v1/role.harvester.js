let utils = require('utils');

function getSource (creep) {
  if (creep.memory.static_source) return creep.memory.static_source;
  var sources = creep.room.find(FIND_SOURCES);
  var i = Math.floor(Math.random() * sources.length);
  return sources[i].id;
}

function getTarget (creep) {
  if (creep.memory.static_target) return creep.memory.static_target;
  var targets = creep.room.find(FIND_STRUCTURES, {
    filter: (structure) => {
      return (((structure.structureType == STRUCTURE_EXTENSION ||
        structure.structureType == STRUCTURE_SPAWN ||
        structure.structureType == STRUCTURE_TOWER) && structure.energy < structure.energyCapacity) ||
        (structure.structureType == STRUCTURE_STORAGE && structure.store < structure.storeCapacity));
    }
  });
  if(targets.length > 0) {
    targets.sort((a,b)=>{return (a.energy/a.energyCapacity)-(b.energy/b.energyCapacity);});
    return targets[0].id;
  }
  return null;
}

var roleHarvester = {
  run: function(creep) {
    if (!creep.memory.task) creep.memory.task = 'harvest';

    // State change
    if (creep.memory.task === 'harvest' && creep.carry.energy === creep.carryCapacity) {
      creep.memory.task = 'dump';
      creep.memory.target = null;
    } else if (creep.memory.task === 'dump' && creep.carry.energy === 0) {
      creep.memory.task = 'harvest';
      creep.memory.source = null;
    }

    if (creep.memory.task === 'harvest') {
      utils.getEnergy(creep, false);
      return true;
    } else { // dump
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
          creep.memory.target = null;
          break;
      }
      return true;
    }
  }
};

module.exports = roleHarvester;
// vim:syntax=javascript:expandtab:ts=2:sw=2
