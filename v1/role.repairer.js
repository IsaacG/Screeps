function getSource (creep) {
  var spawn = creep.pos.findClosestByPath(FIND_MY_SPAWNS);
  if (spawn.energy > 200) {
    return spawn.id;
  } else {
    return creep.pos.findClosestByPath(FIND_SOURCES).id;
  }
}

function getTarget (creep) {
  var targets = creep.room.find(FIND_STRUCTURES, {
    filter: (structure) => {
      return (structure.structureType == STRUCTURE_RAMPART ||
        structure.structureType == STRUCTURE_ROAD ||
        structure.structureType == STRUCTURE_WALL) && structure.hits < structure.hitsMax;
    }
  });

  if(targets.length === 0) return null;

  var willDie = targets.filter((s) => {
    return (s.structureType == STRUCTURE_RAMPART && s.hits < 2*RAMPART_DECAY_AMOUNT) ||
    (s.structureType == STRUCTURE_ROAD && s.hits < 2*ROAD_DECAY_AMOUNT); });
  if (willDie.length > 0) targets = willDie;

  targets.sort((a,b) => {
    return ((a.hits/a.hitsMax)*(a.structureType == STRUCTURE_RAMPART ? 7 : 1) - 
    (b.hits/b.hitsMax)*(b.structureType == STRUCTURE_RAMPART ? 7 : 1))});

  return targets[0].id;
}

var roleRepairer = {
  run: function(creep) {
    if (!creep.memory.task) creep.memory.task = 'harvest';

    // State change
    if (creep.memory.task === 'harvest' && creep.carry.energy === creep.carryCapacity) {
      creep.memory.task = 'repair';
      creep.memory.target = null;
    } else if (creep.memory.task === 'repair' && creep.carry.energy === 0) {
      creep.memory.task = 'harvest';
      creep.memory.source = null;
    }


    if (creep.memory.task === 'harvest') {
      if (!creep.memory.source) creep.memory.source = getSource(creep);

      var source = Game.getObjectById(creep.memory.source);
      if (source.structureType == STRUCTURE_SPAWN) {
        if(creep.withdraw(source, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
          creep.moveTo(source);
        }
      } else {
        if(creep.harvest(source) == ERR_NOT_IN_RANGE) {
          creep.moveTo(source);
        }
      }
      return true;
    } else { // repair
      if (!creep.memory.target) creep.memory.target = getTarget(creep);
      if (!creep.memory.target) return false;
      let target = Game.getObjectById(creep.memory.target);

      if (target.hits === target.hitsMax) {
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
