// General utils

module.exports.goFlag = function (creep) {
  if (!creep.memory.init.flag) return false;
  let flag = Game.flags[creep.memory.init.flag];
  if (creep.room == flag.room) return false;
  creep.moveTo(flag);
  creep.memory.target = null;
  creep.memory.source = null;
  return true;
}

function getSource (creep, tapSpawn) {
  if (creep.memory.static_source) return creep.memory.static_source;
  // If tapSpawn && Spawn got over 200, go there.
  // Find energy to collect. Prefer dropped that has at least enough to fill.
  // After that, go for containers. If those are all empty fal lback to any dropped.
  var r
  if (tapSpawn) {
    r = creep.pos.findClosestByPath(FIND_MY_SPAWNS);
    if (r.energy > 200) return r.id;
  }

  r = creep.pos.findClosestByPath(FIND_DROPPED_ENERGY, {
    filter: (s)=>{return s.amount >= creep.carryCapacity}});
  if (r) return r.id;
  r = creep.pos.findClosestByPath(FIND_STRUCTURES, {
    filter: (s)=>{
      return (s.structureType == STRUCTURE_CONTAINER || s.structureType == STRUCTURE_STORAGE)
        && (s.store[RESOURCE_ENERGY] >= creep.carryCapacity)}});
  if (r) return r.id;

  let has_work = false;
  for (let i in creep.body) {
    if (creep.body[i].type == WORK) { has_work = true; break; }
  }
  if (!has_work) return null;

  r = creep.room.find(FIND_SOURCES);
  return r[Math.floor(Math.random() * r.length)].id;
}

// Get energy. Target drops, containers. Maybe spawn.
module.exports.getEnergy = function (creep, tapSpawn) {
  if (!creep.memory.source) creep.memory.source = getSource(creep, tapSpawn);
  var source = Game.getObjectById(creep.memory.source);
  if (!source) {
    creep.memory.source = null;
    return false;
  }

  var rc;
  if (source instanceof Resource) {
    rc = creep.pickup(source);
    if (source.energy < 200) creep.memory.source = null;
  } else if (source instanceof StructureSpawn) {
    rc = creep.withdraw(source, RESOURCE_ENERGY);
  } else if (source instanceof Source) {
    rc = creep.harvest(source);
  } else {
    rc = creep.withdraw(source, RESOURCE_ENERGY);
  }
  switch (rc) {
    case OK:
      break;
    case ERR_NOT_IN_RANGE:
      creep.moveTo(source);
      break;
    case ERR_NO_BODYPART:
      // creep.say('E_bodypart');
      // console.log(`Creep ${creep.name} missing parts to collect from ${creep.memory.source}`);
      creep.memory.source = null;
      break;
    default:
      creep.memory.source = null;
      break;
  }
  return true;
}

// vim:syntax=javascript:expandtab:ts=2:sw=2
