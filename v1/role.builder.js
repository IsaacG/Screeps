var roleBuilder = {
    run: function(creep) {

        if(creep.memory.building && creep.carry.energy == 0) {
            creep.memory.building = false;
            creep.say('🔄 harvest');
        }
        if(!creep.memory.building && creep.carry.energy == creep.carryCapacity) {
            creep.memory.building = true;
	    delete creep.memory.buildTarget;
            creep.say('🚧 build');
        }

        if(creep.memory.building) {
	    if (!(creep.memory.buildTarget)) {
		    creep.memory.buildTarget = findBuildTarget(creep);
	    }
	    if (!creep.memory.buildTarget) return false;
	    var target = Game.getObjectById(creep.memory.buildTarget);
	    if (target) {
		switch(creep.build(target)) {
		    case OK:
		        break;
		    case ERR_NOT_IN_RANGE:
                        creep.moveTo(target, {visualizePathStyle: {stroke: '#ffffff'}});
			break;
		    default:
		        delete creep.memory.buildTarget;
		}
            } else {
	        delete creep.memory.buildTarget;
	    }
            return true;
        }
        else {
	    if (!creep.memory.source) {
                var sources = creep.room.find(FIND_SOURCES);
		var i = Math.floor(Math.random() * sources.length);
		creep.memory.source = sources[i].id;
	    }
	    var source = Game.getObjectById(creep.memory.source);
            if(creep.harvest(source) == ERR_NOT_IN_RANGE) {
                creep.moveTo(source, {visualizePathStyle: {stroke: '#ffaa00'}});
            }
            return true;
        }
    }
};

function findBuildTarget(creep) {
	var best = null;
	var bestLength = 0;
	var priorities = {
		 STRUCTURE_SPAWN: 5,
		 STRUCTURE_EXTENSION: 10,
		 STRUCTURE_ROAD: 20,
		 STRUCTURE_WALL: 30,
		 STRUCTURE_RAMPART: 40,
		 STRUCTURE_KEEPER_LAIR: 100,
		 STRUCTURE_PORTAL: 100,
		 STRUCTURE_CONTROLLER: 100,
		 STRUCTURE_LINK: 100,
		 STRUCTURE_STORAGE: 15,
		 STRUCTURE_TOWER: 20,
		 STRUCTURE_OBSERVER: 100,
		 STRUCTURE_POWER_BANK: 100,
		 STRUCTURE_POWER_SPAWN: 100,
		 STRUCTURE_EXTRACTOR: 100,
		 STRUCTURE_LAB: 100,
		 STRUCTURE_TERMINAL: 100,
		 STRUCTURE_CONTAINER: 100,
		 STRUCTURE_NUKER: 100,
	};
	creep.room.find(FIND_CONSTRUCTION_SITES).forEach((t) => {
		if (!best) {
			best = t;
			bestLength = creep.room.findPath(creep.pos, best.pos).length;
		} else if (priorities[t.structureType] < priorities[best.structureType]) {
			// Select based off priorities. What about distance?
			best = t;
			bestLength = creep.room.findPath(creep.pos, best.pos).length;
		} else if ((100 * t.progress / t.progressTotal) > (100 * best.progress / best.progressTotal)) {
			// Prefer something that's 25% more done already.
			bestLength = creep.room.findPath(creep.pos, best.pos).length;
			best = t;
		} else {
			var tLength = creep.room.findPath(creep.pos, t.pos).length;
			if (tLength < bestLength) { best = t; bestLength = tLength; }
		}
	});
	return (best ? best.id : null);
}

module.exports = roleBuilder;
