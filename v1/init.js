Game.spawns['Spawn1'].memory.makeCreep = ['harvester', 'builder', 'upgrader']


Object.keys(Game.creeps).map((k,i)=>{return k + ':' + Game.creeps[k].memory.role}) 
Game.spawns['Spawn1'].memory.makeCreep
