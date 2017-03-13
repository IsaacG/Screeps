var roleRepairer = {
    run: function(creep) {
        if(!('source' in creep.memory) || (creep.memory.repairing && creep.carry.energy == 0)) {
            creep.memory.repairing = false;
            creep.say('🔄 harvest');
            var spawn = creep.pos.findClosestByPath(FIND_MY_SPAWNS);
            if (spawn.energy > 200) {
                creep.memory.source = spawn.id
            } else {
                creep.memory.source = creep.pos.findClosestByPath(FIND_SOURCES).id;
            }
        }
        if(!creep.memory.repairing && creep.carry.energy == creep.carryCapacity) {
            creep.memory.repairing = true;
            creep.say('🚧 repair');
        }

        if(!creep.memory.repairing) {
            var source = Game.getObjectById(creep.memory.source);
            if (source.structureType == STRUCTURE_SPAWN) {
                if(creep.withdraw(spawn, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(spawn, {visualizePathStyle: {stroke: '#ffaa00'}});
                }
            } else {
                if(creep.harvest(source) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(source, {visualizePathStyle: {stroke: '#aaaaff'}});
                }
            }
            return true;
        }
        else {
            var targets = creep.room.find(FIND_STRUCTURES, {
                filter: (structure) => {
                    return (structure.structureType == STRUCTURE_RAMPART ||
                        structure.structureType == STRUCTURE_ROAD ||
                        structure.structureType == STRUCTURE_WALL) && structure.hits < structure.hitsMax;
                }
            });
            if(targets.length > 0) {
                var willDie = targets.filter((s) => {
                    return (s.structureType == STRUCTURE_RAMPART && s.hits < 2*RAMPART_DECAY_AMOUNT) ||
                           (s.structureType == STRUCTURE_ROAD && s.hits < 2*ROAD_DECAY_AMOUNT); });
                if (willDie.length > 0) targets = willDie;
                targets.sort(function(a,b){
                    return ((a.hits/a.hitsMax)*(a.structureType == STRUCTURE_RAMPART ? 7 : 1) - 
                            (b.hits/b.hitsMax)*(b.structureType == STRUCTURE_RAMPART ? 7 : 1))});
                var target = targets[0];
                // if ((Game.time % 5) == 0) console.log(`Repair target for ${creep.name} is ${target.structureType}`);
                if(creep.repair(target) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(target, {visualizePathStyle: {stroke: '#ffffff'}});
                }
                return true;
            }
        }
        return false;
    }
};

module.exports = roleRepairer;
