var utils = require ('utils.js');
const Log = utils.Log;
var ActionRegistry = require('actions.js');

var c = require('common/lib/constants.js');

class Task {
  // Construct a task, given a memory object.
  constructor(memory) {
    if (! memory.state) memory.state = 'start'; // Initial state
    this.memory = memory;
    if (!this.memory.actionMemory) this.memory.actionMemory = {}; // Set up an actionMemory
  }
  // Access current task state
  state(s){if (s) this.memory.state = s; return this.memory.state;}
  // Access task name
  name(){return this.memory.taskName}
  // Access task ID
  taskId(){return this.memory.taskId}
  // Return a new Action matching the state.
  action(){
    this.memory.actionMemory.actionName = this.state();
    if (this.state() in ActionRegistry) {
      return new ActionRegistry[this.state()](this.memory.actionMemory);
    } else {
      Log('Invalid state does not map to an action. ' + this.string());
    }
  }
  // Do anything that needs happening before we change to a new action, eg grab info from the action
  preStateChange(action){return;}
  // Do the state transitioning logic here.
  stateTransition(){return}
  // Set up any memory at the start of a state that should persist, eg setting a target.
  enterState(){}
  // Stringify the task
  string(){return `task ${this.name()}[${this.taskId()}]:${this.state()}`}
  // The main task loop. Iterate through actions/state.
  run(){
    var a = this.action();
    while (a.isComplete()) {
      Log('Completed ' + a.string());
      var oldState = this.state;
      this.preStateChange(a);
      this.stateTransition();
      this.enterState();
      if (oldState === this.state) {Log('No state change from ' + this.name() + ':' + this.state());return;}
      a = this.action();
    }
    Log('Run ' + a.string());
    a.run();
  }
  // Utility accessor to a game object
  gameObj(name, val){
    if (val !== undefined) this.memory[name] = val;
    if (this.memory[name]) return Game.getObjectById(this.memory[name]);
    return null;
  }
}

// Init task for keeping things running.
// Launch other tasks that are needed to run.
// For now, just launch a harvester when there is none.
class TaskInit extends Task {
  run(){
    if (Object.keys(Memory.tasks).length === 1) {
      console.log('Only init running. Spawn harvester task.');
      utils.LaunchTask('harvester', {do_spawn: true});
    }
  }
}

// Generic task for workers.
class TaskWorker extends Task {
  constructor(memory) {
    super(memory);
    // Workers get a default list of parts. May want to override.
    if (!memory.parts) memory.parts = [MOVE, CARRY, WORK, MOVE, CARRY, WORK];
  }
  // Setter/Getter. Takes an ID. Returns a Creep.
  worker(s){return this.gameObj('worker', s);}
  target(s){return this.gameObj('target', s);}

  preStateChange(action){
    // If we are transitioning out of state get_creep|spawn_worker, we want to grab that worker.
    if (this.state() === 'get_creep' || this.state() === 'spawn') this.worker(action.memory.creep);
  }
  // Set a target when we enter a state
  enterState(){this.target(null)}
  // State logic
  stateTransition(){
    // If no worker, get one.
    if (!this.worker()) {
      // Make smart choice between spawn and reused
      if (Object.keys(Game.creeps).length > 0) {
        this.state('get_creep');
      } else {
        this.state('spawn');
        this.memory.actionMemory.parts = this.memory.parts
      }
    } else if (this.no_target) {
      this.state('end');
      this.memory.actionMemory.end_reason = 'no targets found';
    } else {
      if (this.worker().energy >= 50) {
        // If worker and energy, do work.
        this.state(this.work_state);
      } else {
        // If worker and no energy, get energy.
        this.state('harvest')
      }
    }
  }
}

// Harvester task. Harvest energy and move it to Spawns and Extensions.
class TaskHarvester extends TaskWorker {
  constructor(memory){
    memory.name = 'harvester';
    super(memory)
    this.work_state = 'fuel'
  }
  enterState(){
    if (this.state() === 'harvest') {
      this.target = this.worker().pos.findClosestByPath(FIND_SOURCES).id;
    } else if (this.state() === 'fuel') {
      var creep = this.worker()
      var best = null;
      creep.room.find(FIND_STRUCTURES).forEach((s)=>{
        // Find a spawn/extension which is not full.
        if(!(s.structureType === STRUCTURE_EXTENSION || s.structureType === STRUCTURE_SPAWN)){
        } else if(s.energy === s.energyCapacity) {
        } else if(best === null){
          best = s;
        // Select the one which needs the most to fill up.
        } else if((best.energyCapacity - best.energy) < (s.energyCapacity - s.energy)){
          best = s;
        }
      });
      if (best) {
        this.target(best.id);
      } else {
        this.no_target = true;
      }
    }
  }
}

class TaskUpgrader extends TaskWorker {
  constructor(o){
    if (o === undefined) o = {};
    o.name = '_upgrader';
    if (!o.parts) o.parts = [MOVE, CARRY, WORK, CARRY, MOVE, WORK];
    if (!o.unit && Object.keys(Game.creeps).length != 0) o.unit = Game.creeps[Object.keys(Game.creeps)[0]].id;
    super(o);
    this.parts = o.parts;
  }
  stateTransition(){
    var creep = Game.getObjectById(this.unit);
    if((creep.carry[RESOURCE_ENERGY]/creep.carryCapacity) > 0.5){
      // Go upgrade the controller.
      this.target = creep.room.controller.od;
      this.state = 'upgrade';
    } else {
      // Find the closest source and go harvest.
      this.target = creep.pos.findClosestByPath(FIND_SOURCES).id;
      this.state = 'harvest';
    }
    return this.state;
  }
}

module.exports = {
  _upgrader: TaskUpgrader,
  harvester: TaskHarvester,
  init: TaskInit,
};

// vim:syntax=javascript:expandtab:ts=2:sw=2
