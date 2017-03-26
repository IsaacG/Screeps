global.build = (x) => Game.spawns['Spawn1'].memory.makeCreep.push(x)
global.list = () => Object.keys(Game.creeps).map((k,i)=>{return k + ':' + JSON.stringify(Game.creeps[k].memory.init)}) 
global.suicide = (x) => Game.creeps[x].suicide()
