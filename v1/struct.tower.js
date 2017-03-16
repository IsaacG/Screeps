function repairRanker(tower, structure) {
  if (!tower) { console.log("No tower passed."); return null; }
  if (!structure) { console.log("No structure passed."); return null; }
  var value = structure.hits / structure.hitsMax;
  value *= (structure.structureType == STRUCTURE_RAMPART ? 7 : 1);
  value /= Math.sqrt(tower.pos.getRangeTo(structure));
  return value;
}

function findClosestDamaged(tower) {
    var closestDamagedStructure = tower.pos.findClosestByRange(FIND_STRUCTURES, {
      filter: (structure) => structure.hits < structure.hitsMax
    });
    return closestDamagedStructure;
}

function findBestToRepair(tower) {
	if (!(Memory.tower_repair_target)) Memory.tower_repair_target = {};

	var repair = Memory.tower_repair_target;

	if (!(repair[tower.id]) || (Game.time % 15) === 0) {
	  repair[tower.id] = null;
    var targets = tower.room.find(FIND_STRUCTURES);
    targets = targets.filter((s) => {return s.hits < s.hitsMax});
    targets = targets.filter((s) => {
      return (s.structureType == STRUCTURE_RAMPART ||
        s.structureType == STRUCTURE_ROAD ||
        s.structureType == STRUCTURE_WALL);
    });
    if (targets.length > 0) {
      var willDie = targets.filter((s) => {
        return (s.structureType == STRUCTURE_RAMPART && s.hits < 2*RAMPART_DECAY_AMOUNT) ||
           (s.structureType == STRUCTURE_ROAD && s.hits < 2*ROAD_DECAY_AMOUNT); });
      if (willDie.length > 0) targets = willDie;
      if (targets.length > 1) {
        targets.sort((a,b) => {
          return repairRanker(tower, a) - repairRanker(tower, b); });
      }
      repair[tower.id] = targets[0].id;
    }
	}
  return Game.getObjectById(repair[tower.id]);
}

var structTower = {
  run: function(tower) {
	
    if (false) {
      var repair = findClosestDamaged(tower);
    } else {
      var repair = findBestToRepair(tower);
    }
    if(repair) {
      tower.repair(repair);
    }

    var closestHostile = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
    if(closestHostile) {
      tower.attack(closestHostile);
    }
  }
};

module.exports = structTower;

// vim:syntax=javascript:expandtab:ts=2:sw=2
