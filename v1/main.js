require('globals')

let utils = require('utils');
var roleRepairer = require('role.repairer');
var roleHarvester = require('role.harvester');
var roleHauler = require('role.hauler');
var roleHarvesterS = require('role.harvester_s');
var roleUpgrader = require('role.upgrader');
var roleBuilder = require('role.builder');
var roleGoFlag = require('role.goflag');
var roleMisc = require('role.misc');
var structTower = require('struct.tower');
var spawnMakeCreep = require('spawn.makeCreep');


module.exports.loop = function () {
  var spawn = Game.spawns["Spawn1"]
    if (!('makeCreep' in spawn.memory)) spawn.memory.makeCreep = [{role: 'harvester'}, {role: 'upgrader'}, {role: 'builder'}];

  // Auto spawn slowly up to the desired count.
  if ((Game.time % 25) === 0) {
    var desired_count = {
           harvester_s: 2,
           hauler: 1,
           upgrader: 3,
           builder: 1,
           repairer: 1,
    }
    for (var name in Game.rooms) {
      let source_count  = Game.rooms[name].find(FIND_SOURCES).length;
      desired_count.harvester_s = source_count;
      desired_count.upgrader = source_count + 1;
      desired_count.repairer = source_count - 1;
      let construction = Game.rooms[name].find(FIND_CONSTRUCTION_SITES).length;
      if (construction == 0) {
        desired_count.builder = 0;
      } else if (construction < 10) {
        desired_count.builder = 1;
      } else {
        desired_count.builder = 2;
      }

      var role_count = {harvester: 0, upgrader: 0, builder: 0, repairer: 0, hauler: 0, harvester_s: 0};
      Game.rooms[name].find(FIND_MY_CREEPS).forEach((c) => {
        role = c.memory.init.role;
        if (role_count[role]) {
          role_count[role]++;
        } else {
          role_count[role] = 1;
        }
      });
      let s = Game.rooms[name].find(FIND_MY_SPAWNS)[0];
      if (role_count.harvester_s == 0 || role_count.hauler == 0) s.memory.makeCreep.push('harvester');
      Object.keys(desired_count).forEach((r) => {
        if (s.memory.makeCreep.length > 0) return;
        if ((!role_count[r]) || desired_count[r] > role_count[r]) {
          console.log(`For role ${r} we desire ${desired_count[r]} and have ${role_count[r]}. Spawn more.`);
          s.memory.makeCreep.push(r);
        }
      });
    }
  }

  for(var name in Game.rooms) {
    var towers = Game.rooms[name].find(FIND_STRUCTURES, {
      filter: (structure) => {return (structure.structureType == STRUCTURE_TOWER)}});
    towers.forEach(tower => structTower.run(tower));
  }

  if ((Game.time % 10) == 0) {
    for (var name in Game.spawns) {
      let s = Game.spawns[name];
      if (s && s.memory.makeCreep && s.memory.makeCreep.length != 0 && ! s.spawning) spawnMakeCreep.run(s);
    }
    for (var name in Memory.creeps) if (!Game.creeps[name]) delete Memory.creeps[name];
  }

  for(var name in Game.creeps) {
    var creep = Game.creeps[name];
    if (!creep.memory.init) creep.memory.init = {};
    if (!('role' in creep.memory.init)) creep.memory.init.role = 'harvester';
    var role = creep.memory.init.role;

    if (creep.ticksToLive == 5 && !creep.memory.pushedRegen) {
      let s = creep.room.find(FIND_MY_SPAWNS)[0];
      if (!s) s = Game.spawns['Spawn1'];
      s.memory.makeCreep.push(creep.memory.init);
      creep.memory.pushedRegen = true;
    }

    var roleMap = {
harvester: [roleHarvester],
           harvester_s: [roleHarvesterS],
           hauler: [roleHauler],
           upgrader: [roleUpgrader],
           repairer: [roleRepairer],
           goflag: [roleGoFlag],
           misc: [roleMisc],
           builder: [roleBuilder]};
    var roleList = roleMap[role];
    if (!utils.goFlag(creep) && roleList) {
      while (roleList.length != 0) {
        if (roleList.shift().run(creep)) break;
      }
    }
  }
};
// vim:syntax=javascript:expandtab:ts=2:sw=2
