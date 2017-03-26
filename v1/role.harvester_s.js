/* Static harvester */
function getSource (creep) {
  var sources = creep.room.find(FIND_SOURCES);
  // Balance by the count of harvesters at the source
  // Move onto containers if there is one.

  for (let i in Object.keys(sources)) {
    let h = sources[i].pos.findInRange(FIND_CREEPS, 1, {filter: (c)=>{return (c.memory) && (c.memory.init.role == 'harvester_s')}});
    if (h.length == 0) return sources[i].id;
  }

  var i = Math.floor(Math.random() * sources.length);
  return sources[i].id;
}

function objToPos(o) {
  return new RoomPosition(o.x, o.y, o.roomName)
}

function posToObj(pos) {
  return {x: pos.x, y: pos.y, roomName: pos.roomName};
}

function getPosition(source) {
  // Find a good place to stand.
  // If the source got a container next to it without a static harvester in it, we want that.
  // Otherwise, anything next to the source is good.
  //console.log(source.pos);
  let h = source.pos.findInRange(FIND_STRUCTURES, 1, {
    filter: (s)=>{return (s.structureType == STRUCTURE_CONTAINER || s.structureType == STRUCTURE_STORAGE)}});
  for (let i in Object.keys(h)) {
    let j = h[i].pos.look().filter((s)=>{return ((s.type == LOOK_CREEPS) && (s[LOOK_CREEPS].memory.init.role == 'harvester_s'))});
    if (j.length == 0) return posToObj(h[i].pos);
  }
  console.log('No open container spots found');

  h = source.pos.findInRange(FIND_STRUCTURES, 1, {filter: {structureType: STRUCTURE_ROAD}});
  for (let i in Object.keys(h)) {
    let j = h[i].pos.look().filter((s)=>{return ((s.type == LOOK_CREEPS) && (s[LOOK_CREEPS].memory.init.role == 'harvester_s'))});
    if (j.length == 0) return posToObj(h[i].pos);
  }
  console.log('No open road spots found');

}


var roleHarvester = {
  run: function(creep) {
    if (!creep.memory.source) creep.memory.source = getSource(creep);
    var source = Game.getObjectById(creep.memory.source);
    if (!creep.memory.pos) creep.memory.pos = getPosition(source);
    var pos = objToPos(creep.memory.pos);
    if (creep.pos.isEqualTo(pos)) {
      creep.harvest(source);
    } else {
      creep.moveTo(pos);
    }
    return true;
  }
};

module.exports = roleHarvester;
// vim:syntax=javascript:expandtab:ts=2:sw=2
