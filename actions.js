var utils = require ('utils.js');
const Log = utils.Log;
const Debug = utils.Debug;

// Generic Action
class Action {
  // Gets initialize with some task.memory.actionMemory
  constructor(memory) {
    this.actionName = memory.actionName;
    this.memory = memory;
    if (!('rc' in this.memory)) this.memory.rc = OK;
  }
  // Does some unit of work that takes a tick. One run per loop.
  run(){}
  // Do we need to run work or can we move to the next action?
  isComplete(){return true;}
  // Any cleanup like memory items no longer needed.
  cleanUp(){}
  // Stringify
  string(){return 'action ' + this.actionName}

  string(){return `action#${this.memory.tId} ${this.actionName}`}
  debug(s){Debug(`${this.string()}: ${s}`)}

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
    if (Game.creeps.length > 0) {
      memory.creep = Game.creeps[Object.keys(Game.creeps)[0]].id;
    }
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
    // this.debug(`Created ${this.string()} with memory ${JSON.stringify(this.memory)}`)
    this.spawn(Game.spawns[Object.keys(Game.spawns)[0]].id)
    // Null out the creep if it's gone.
    if (!this.creep()) this.creep(null);
  }

  creep(s){return this.gameObj('creep', s);}
  spawn(s){return this.gameObj('spawn', s);}

  run(){
    var spawn = this.spawn()
    if (this.creep()) return; // No work if we created a creep already.
    if (spawn.spawning) return; // No work if busy spawning.
    if (this.memory.creepName) {
      if (this.memory.creepName in Game.creeps) this.creep(Game.creeps[this.memory.creepName].id);
      delete this.memory.creepName;
    }

    // Copy the parts list
    var parts = [];
    this.memory.parts.forEach((p)=>{parts.push(p)});;

    while (spawn.canCreateCreep(parts) == ERR_NOT_ENOUGH_ENERGY) parts.pop();
    if (parts.length < 3) return;

    var rc = spawn.createCreep(parts);
    if(typeof(rc) !== "string") {
      Log(`${this.string()} failed to createCreep. Got ${rc}.`);
    } else {
      this.debug(`${this.string()} created creep ${rc}`);
      this.memory.creepName = rc;
    }
  }
  isComplete(){
    return (this.creep() && !(this.creep().spawning));
  }
  cleanUp(){ delete this.memory.spawn; }
}

// Base class for all sorts of actions a worker may perform
class ActionWorkerCreep extends Action {
  creep(s){return this.gameObj('creep', s);}
  target(s){return this.gameObj('target', s);}
  isComplete(){ 
    if (!this.creep()) {
      Log(`${this.string()} has no creep. Did it die?`);
      return true;
    }
    if (!this.target()) {
      this.debug(`${this.string()} has no target. Ran out of stuff?`);
      return true;
    }
    return this.jobComplete()
  }
}

// Harvesting. Go to the target and harvest until we are full.
class ActionHarvest extends ActionWorkerCreep {
  run(){
    this.memory.rc = this.creep().harvest(this.target());
    if (this.memory.rc === ERR_NOT_IN_RANGE) this.creep().moveTo(this.target());
  }
  jobComplete(){
    if (this.memory.is_static) return false; // Static work is never over.
    return _.sum(this.creep().carry) === this.creep().carryCapacity;
  }
}

// Pickup. Find energy and gather it up.
class ActionPickup extends ActionWorkerCreep {
  run(){
    this.memory.rc = this.creep().pickup(this.target());
    if (this.memory.rc === ERR_NOT_IN_RANGE) this.creep().moveTo(this.target());
  }
  jobComplete(){
    return (this.memory.rc == ERR_INVALID_TARGET || this.memory.rc == ERR_FULL);
  }
  cleanUp(){ this.memory.rc = OK; }
}

// Withdraw energy from the closest Spawn.
class ActionWithdraw extends ActionWorkerCreep {
  run(){
    if (this.creep().withdraw(this.target(), RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
      this.creep().moveTo(this.target());
    }
  }
  jobComplete(){ return this.target().energy === 0 || _.sum(this.creep().carry) === this.creep().carryCapacity; }
}

// Fuel a target. Go to the target and transfer until target full or creep is empty.
class ActionFuel extends ActionWorkerCreep {
  run(){
    if(this.creep().transfer(this.target(), RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
      this.creep().moveTo(this.target()); 
    }
  }
  jobComplete(){
    if (this.creep().carry[RESOURCE_ENERGY] === 0) return true; // Creep empty
    if (this.target().energy === this.target().energyCapacity) return true; // Target full
    return false;
  }
}

// Build construction. Find a contruction site and build it up.
class ActionBuild extends ActionWorkerCreep {
  run(){
    var rc = this.creep().build(this.target());
    if (rc === OK) {
      return;
    } else if (rc === ERR_NOT_IN_RANGE) {
      this.creep().moveTo(this.target()); 
    } else if (rc === ERR_INVALID_TARGET) {
      Log(`${this.string()} got ERR_INVALID_TARGET. Assuming done building?`);
      this.memory.build_done = true
    } else {
      Log(`${this.string()} got unknown ERR ${rc}.`);
    }
  }
  jobComplete(){
    if (this.memory.build_done) { this.memory.build_done = false; return true; } // Done
    if (this.creep().carry[RESOURCE_ENERGY] === 0) return true; // Creep empty
    if (this.target().progress === this.target().progressTotal) return true; // Target complete
    return false;
  }
}

// Upgrade a controller. Go to the target and transfer until target full or creep is empty.
class ActionUpgrade extends ActionWorkerCreep {
  run(){
    if(this.creep().upgradeController(this.target()) === ERR_NOT_IN_RANGE) {
      this.creep().moveTo(this.target()); 
    }
  }
  jobComplete(){ return (this.creep().carry[RESOURCE_ENERGY] === 0) } // Creep empty
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
  pickup: ActionPickup,
  build: ActionBuild,
  fuel: ActionFuel,
  spawn: ActionSpawn,
  get_creep: ActionGetCreep,
  withdraw: ActionWithdraw,
  end: ActionEnd,
  start: Action,
  wait: Action,
};

// vim:syntax=javascript:expandtab:ts=2:sw=2
