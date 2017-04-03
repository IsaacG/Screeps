global.build = (x) => Game.spawns['Spawn1'].memory.makeCreep.push(x)
global.list = () => Object.keys(Game.creeps).map((k,i)=>{return k + ':' + JSON.stringify(Game.creeps[k].memory.init)}) 
global.li = (x) => {let r={}; Game.rooms[x].find(FIND_MY_CREEPS).forEach((c)=>{let l = c.memory.init.role; if (!(l in r)) r[l]=[]; r[l].push(`${c.name}(${c.body.length})`);}); return JSON.stringify(r);}
global.l = () => {let o =""; for(var n in Game.rooms){o += `${n}: ${li(n)}\n`;}; return o;}
global.suicide = (x) => Game.creeps[x].suicide()

global.ex = (x) => JSON.stringify(x, null, 2);    // explain

