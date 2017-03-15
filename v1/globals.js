global.build = (x) => Game.spawns['Spawn1'].memory.makeCreep.push(x)
global.list = () => Object.keys(Game.creeps).map((k,i)=>{return k + ':' + Game.creeps[k].memory.role}) 
