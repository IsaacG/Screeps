var spawnMakeCreep = {
  run: function(spawn) {
    if (spawn.memory.makeCreep.length == 0) return;
    if (spawn.spawning) return;

    var role;
    var init;
    let next = spawn.memory.makeCreep[0];
    if (typeof(next) == 'string') {
      role = next; init = {role: role};
    } else {
      init = next;
      role = init.role;
    }

    var partList = {
      builder: [MOVE, CARRY, WORK, WORK, MOVE, CARRY, WORK, MOVE, CARRY],
      goflag: [MOVE, CARRY, WORK, WORK, MOVE, CARRY, WORK, MOVE, CARRY],
      harvester: [MOVE, CARRY, WORK, CARRY, MOVE, WORK],
      harvester_s: [MOVE, WORK, WORK, WORK, WORK, WORK],
      hauler: [MOVE, CARRY, CARRY, MOVE, CARRY, MOVE, MOVE],
      repairer: [MOVE, CARRY, WORK, WORK, CARRY, MOVE, WORK, CARRY, MOVE],
      misc: [MOVE, CARRY, WORK, CLAIM, MOVE, WORK],
      upgrader: [MOVE, CARRY, WORK, WORK, MOVE, WORK, MOVE, CARRY]};
    if (!(role in partList)) {spawn.memory.makeCreep.shift(); return;}
    var parts = partList[role];
    while (spawn.canCreateCreep(parts) == ERR_NOT_ENOUGH_ENERGY) parts.pop();
    if (parts.length < 3) return;

    var name = spawn.createCreep(parts, {init: init});
    if (typeof(name) != "string") {
      console.log("Failed to make create: " + name)
    } else {
      spawn.memory.makeCreep.shift();
      console.log(`${spawn.name} made creep ${name} (${role}). Parts: ${parts} (${parts.length})`);
    }
  }
};
module.exports = spawnMakeCreep;

// vim:syntax=javascript:expandtab:ts=2:sw=2
