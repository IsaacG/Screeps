require('globals')

let utils = require('utils');
var roleRepairer = require('role.repairer');
var roleHarvester = require('role.harvester');
var roleHauler = require('role.hauler');
var roleHarvesterS = require('role.harvester_s');
var roleUpgrader = require('role.upgrader');
var roleBuilder = require('role.builder');
var roleGoFlag = require('role.goflag');
var structTower = require('struct.tower');
var spawnMakeCreep = require('spawn.makeCreep');


module.exports.loop = function () {
    var spawn = Game.spawns["Spawn1"]
    if (!('makeCreep' in spawn.memory)) spawn.memory.makeCreep = ['harvester', 'upgrader', 'builder'];

    // Auto spawn slowly up to the desired count.
    if ((Game.time % 50) === 0) {
        var role_count = {harvester: 0, upgrader: 0, builder: 0, repairer: 0};
        var desired_count = {
            harvester: 1,
            harvester_s: 2,
            hauler: 1,
            upgrader: 3,
            builder: 1,
            repairer: 1,
        }
        Object.keys(Game.creeps).forEach((c) => {
            if (role_count[Game.creeps[c].memory.init.role]) {
              role_count[Game.creeps[c].memory.init.role]++;
            } else {
              role_count[Game.creeps[c].memory.init.role] = 1;
            }
        });
        Object.keys(desired_count).forEach((r) => {
            if (spawn.memory.makeCreep.length > 0) return;
            if ((!role_count[r]) || desired_count[r] > role_count[r]) {
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
        if (!creep.memory.init) creep.memory.init = {};
        if (!('role' in creep.memory.init)) creep.memory.init.role = 'harvester';
        var role = creep.memory.init.role;

        if (creep.ticksToLive == 50 && !creep.memory.pushedRegen) {
            spawn.memory.makeCreep.push(creep.memory.init);
            creep.memory.pushedRegen = true;
        }

	    /*
            harvester: [roleHarvester, roleBuilder, roleUpgrader],
            harvester_s: [roleHarvesterS],
            hauler: [roleHauler, roleBuilder, roleUpgrader],
            upgrader: [roleUpgrader],
            repairer: [roleRepairer, roleBuilder, roleUpgrader],
            builder: [roleBuilder, roleHarvester, roleRepairer, roleUpgrader]};
	    */
        var roleMap = {
            harvester: [roleHarvester],
            harvester_s: [roleHarvesterS],
            hauler: [roleHauler],
            upgrader: [roleUpgrader],
            repairer: [roleRepairer],
            goflag: [roleGoFlag],
            builder: [roleBuilder]};
        var roleList = roleMap[role];
        if (!utils.goFlag(creep)) {
          while (roleList.length != 0) {
              if (roleList.shift().run(creep)) break;
          }
        }
    }
};
// vim:syntax=javascript:expandtab:ts=2:sw=2
