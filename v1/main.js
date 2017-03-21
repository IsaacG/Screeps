require('globals')

var roleRepairer = require('role.repairer');
var roleHarvester = require('role.harvester');
var roleUpgrader = require('role.upgrader');
var roleBuilder = require('role.builder');
var structTower = require('struct.tower');
var spawnMakeCreep = require('spawn.makeCreep');


module.exports.loop = function () {
    var spawn = Game.spawns["Spawn1"]
    if (!('makeCreep' in spawn.memory)) spawn.memory.makeCreep = ['harvester', 'upgrader', 'builder'];

    // Auto spawn slowly up to the desired count.
    if ((Game.time % 100) === 0) {
        var role_count = {harvester: 0, upgrader: 0, builder: 0, repairer: 0};
        var desired_count = {
            harvester: 4,
            upgrader: 3,
            builder: 2,
            repairer: 1
        }
        Object.keys(Game.creeps).forEach((c) => {
            role_count[Game.creeps[c].memory.role]++;
        });
        Object.keys(desired_count).forEach((r) => {
            if (spawn.memory.makeCreep.length > 0) return;
            if (desired_count[r] > role_count[r]) {
		console.log(`For role ${r} we desire ${desired_count[r]} and have ${role_count[r]}. Spawn more.`);
                spawn.memory.makeCreep.push(r);
            }
        });
    }

    var towers = spawn.room.find(FIND_STRUCTURES, {
    filter: (structure) => {return (structure.structureType == STRUCTURE_TOWER)}});
    towers.forEach(tower => structTower.run(tower));

    if ((Game.time % 10) == 0) {
        if (spawn.memory.makeCreep.length != 0 && ! spawn.spawning) spawnMakeCreep.run(spawn);
        for (var name in Memory.creeps) if (!Game.creeps[name]) delete Memory.creeps[name];
    }

    for(var name in Game.creeps) {
        var creep = Game.creeps[name];
        if (!('role' in creep.memory)) creep.memory.role = 'harvester';
        var role = creep.memory.role;

        if (creep.ticksToLive == 50 && !creep.memory.pushedRegen) {
            spawn.memory.makeCreep.push(role);
            creep.memory.pushedRegen = true;
        }

        var roleMap = {
            harvester: [roleHarvester, roleBuilder, roleUpgrader],
            upgrader: [roleUpgrader],
            repairer: [roleRepairer, roleBuilder, roleUpgrader],
            builder: [roleBuilder, roleHarvester, roleRepairer, roleUpgrader]};
        var roleList = roleMap[role];
        while (roleList.length != 0) {
            if (roleList.shift().run(creep)) break;
        }
    }
};
