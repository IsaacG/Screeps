var utils = require ('utils.js');
const Log = utils.Log;

// Generic Action
class Action {
  // Gets initialize with some task.memory.actionMemory
  constructor(memory) {
    this.actionName = memory.actionName;
    this.memory = memory;
  }
  // Does some unit of work that takes a tick. One run per loop.
  run(){}
  // Do we need to run work or can we move to the next action?
  isComplete(){return true;}
  // Stringify
  string(){return 'action ' + this.actionName}
  // Utility accessor to a game object
  gameObj(name, val){
    if (val !== undefined) this.memory[name] = val;
    if (this.memory[name]) return Game.getObjectById(this.memory[name]);
    return null;
  }
};

// Simple action that does no work; it simply finds a worker.
class ActionGetCreep extends Action {
  constructor(memory) {
    // Set memory.creep to the first creep.
    memory.creep = Game.creeps[Object.keys(Game.creeps)[0]].id
    super(memory)
  }
  // Always done. We do the work in the constructor as we don't need a loop.
  isComplete(){return true;}
}

// Create a creep from the first spawn.
class ActionSpawn extends Action {
  constructor(memory){
    // Set spawn to the first spawn.
    super(memory)
    Log(`Created ${this.string()} with memory ${JSON.stringify(this.memory)}`)
    this.spawn(Game.spawns[Object.keys(Game.spawns)[0]].id)
    this.creep(null)
  }

  creep(s){return this.gameObj('creep', s);}
  spawn(s){return this.gameObj('spawn', s);}

  run(task){
    var spawn = this.spawn()
    Log(spawn);
    if (this.creep()) return; // No work if we created a creep already.
    if (spawn.spawning) return; // No work if busy spawning.

    // Copy the parts list
    var parts = [];
    this.memory.parts.forEach((p)=>{parts.push(p)});;

    while (spawn.canCreateCreep(parts) == ERR_NOT_ENOUGH_ENERGY) parts.pop();
    if (parts.length < 3) {Log('ActionSpawn.run: Not enough energy.'); return;}

    var rc = spawn.createCreep(parts);
    Log(`${this.string()} createCreep => (${rc})`);
    if(typeof(rc) !== "string") return;

    this.creep(Game.creeps[rc].id);
  }
  isComplete(){
    return (this.creep() && !this.creep().spawning);
  }
}


class ActionUpgrade extends Action {
  constructor(task) {
    if (task.target === undefined) task.target = Game.getObjectById(task.unit).room.controller.id;
    super('upgrade', task.unit, task.target);
  }
  run(){ if(this.actor.upgradeController(this.actee) === ERR_NOT_IN_RANGE) this.actor.moveTo(this.actee); }
  isComplete(){ return (this.actor.carry[RESOURCE_ENERGY] === 0); }
};

// Harvesting. Go to the target and harvest until we are full.
class ActionHarvest extends Action {
  constructor(task) { super('harvest', task.unit, task.target); }
  run(){ if(this.actor.harvest(this.actee) === ERR_NOT_IN_RANGE) this.actor.moveTo(this.actee); }
  isComplete(){ return _.sum(this.actor.carry) === this.actor.carryCapacity; }
}

// Fuel a target. Go to the target and transfer until target full or creep is empty.
class ActionFuel extends Action {
  constructor(task) { super('fuel', task.unit, task.target); }
  run(){ if(this.actor.transfer(this.actee, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) this.actor.moveTo(this.actee); }
  isComplete(){ return !(this.actor.carry[RESOURCE_ENERGY] !== 0 && this.actee.energy !== this.actee.energyCapacity); }
}

// End. Task is complete. Should be reaped.
class ActionEnd extends Action {
  constructor(actor, actee) { super('end', actor, actee) }
  run(){return}
  isComplete(){return false}
}

module.exports = {
  upgrade: ActionUpgrade,
  harvest: ActionHarvest,
  fuel: ActionFuel,
  spawn: ActionSpawn,
  get_creep: ActionGetCreep,
  end: ActionEnd,
  start: Action,
};

// vim:syntax=javascript:expandtab:ts=2:sw=2
