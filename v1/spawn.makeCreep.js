var spawnMakeCreep = {

    run: function(spawn) {
        if (spawn.memory.makeCreep.length == 0) return;
        if (spawn.spawning) return;
        if (spawn.room.energyAvailable < 0.9 * spawn.room.energyCapacityAvailable) return;

        var role = spawn.memory.makeCreep[0];
        var partList = {
            builder: [MOVE, CARRY, WORK, WORK, MOVE, CARRY, WORK, MOVE, CARRY, WORK, MOVE],
            harvester: [MOVE, CARRY, WORK, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, WORK],
            repairer: [MOVE, CARRY, WORK, WORK, CARRY, MOVE, WORK, CARRY, MOVE, WORK, CARRY, MOVE],
            upgrader: [MOVE, CARRY, WORK, WORK, MOVE, WORK, MOVE, CARRY, WORK, MOVE]};
        var parts = partList[role];
        while (spawn.canCreateCreep(parts) == ERR_NOT_ENOUGH_ENERGY) parts.pop();

        var name = spawn.createCreep(parts, {role: role});
        if (typeof(name) != "string") {
            console.log("Failed to make create: " + name)
        } else {
            spawn.memory.makeCreep.shift();
            console.log("Made creep '" + name + "', role " + role + ". Parts: " + parts + " (" + parts.length + ")");
            // console.log("Creeps left to create: " + spawn.memory.makeCreep.length + ". " + spawn.memory.makeCreep);
        }
    }
};
module.exports = spawnMakeCreep;
