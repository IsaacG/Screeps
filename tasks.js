// TODO: Have the upgrader smart-select the source based on the energy?
// TODO: Figure out if we got unused creeps to use for a new role.
// TODO: Static harvester + hauler
// TODO: Fill extensions up
// TODO: Repairers
// TODO: static miners to go to other mines?
// TODO: Finer grain debug output (task, action, info, debug)
// TODO: Haulers to collect from containers

var utils = require ('utils.js');
const Log = utils.Log;
const Debug = utils.Debug;
var ActionRegistry = require('actions.js');

class Task {
  // Construct a task, given a memory object.
  constructor(memory) {
    if (! memory.state) memory.state = 'start'; // Initial state
    this.memory = memory;
    if (!this.memory.actionMemory) this.memory.actionMemory = {};
  }
  // //////////////////////////////////
  // ACCESSORS
  // Access current task state
  state(s){if (s) this.memory.state = s; return this.memory.state;}
  // Access task name
  name(){return this.memory.name}
  // Access task ID
  taskId(){return this.memory.taskId}
  // Utility accessor to a game object
  gameObj(name, val){
    if (val !== undefined) this.memory[name] = val;
    if (this.memory[name]) return Game.getObjectById(this.memory[name]);
    return null;
  }

  // //////////////////////////////////
  // HELPERS
  // Return a new Action matching the state.
  action(){
    if (!this.memory.actionMemory) this.memory.actionMemory = {}; // Set up an actionMemory
    this.memory.actionMemory.actionName = this.state();
    this.memory.actionMemory.tId = this.taskId();
    if (this.state() in ActionRegistry) {
      return new ActionRegistry[this.state()](this.memory.actionMemory);
    } else {
      Log('Invalid state does not map to an action. ' + this.string());
    }
  }
  // Stringify the task
  string(){return `task#${this.taskId()} ${this.name()}:${this.state()}`}
  debug(s){Debug(`${this.string()}: ${s}`)}

  // //////////////////////////////////
  // STATE MACHINE
  // Do anything that needs happening before we change to a new action, eg grab info from the action
  preStateChange(action){return;}
  // Do the state transitioning logic here.
  stateTransition(){return}
  // Set up any memory at the start of a state that should persist, eg setting a target.
  enterState(oldState){}
  // The main task loop. Iterate through actions/state.
  run(){
    var a = this.action();
    while (a.isComplete()) {
      a.cleanUp();
      var oldState = this.state;
      this.preStateChange(a);
      this.stateTransition();
      this.enterState(oldState);
      if (oldState === this.state) {
        // if (this.state() != 'wait') self.debug('No state change from ' + this.name() + ':' + this.state());
        return;
      }
      a = this.action();
    }
    // this.debug('Run ' + a.string());
    a.run();
  }
}

// Init task for keeping things running.
// Launch other tasks that are needed to run.
// For now, just launch a harvester when there is none.
class KTaskInit extends Task {
  run(){
    if (Object.keys(Memory.tasks).length === 1) {
      console.log('Only init running. Spawn harvester task.');
      utils.LaunchTask('harvester', {use_new_creep: true});
    }
  }
}

// Maintain a list of Creeps that are available to do work.
// Find Creeps that are the worker() of two TaskWorker threads.
class KTaskWorkerTracker extends Task {
}

// Generic task for workers.
class TaskWorker extends Task {
  constructor(memory) {
    // Workers get a default list of parts. May want to override.
    if (!memory.parts) memory.parts = [MOVE, CARRY, WORK, MOVE, CARRY, WORK];
    super(memory);
    this.work_state = null; // What sort of work does this worker do
    this.energy_method = null; // Where does this worker go for energy
  }
  // Setter/Getter. Takes an ID. Returns a Creep.
  worker(s){return this.gameObj('worker', s);}

  preStateChange(action){
    // If we are transitioning out of state get_creep|spawn_worker, we want to grab that worker.
    if (this.state() === 'get_creep' || this.state() === 'spawn') this.worker(action.memory.creep);
  }
  findTargetFrom(){}
  findTargetTo(){}
  enterState(oldState){
    var target;
    if (this.state() === this.energy_method) {
      target = this.findTargetFrom()
    } else if (this.state() === this.work_state) {
      target = this.findTargetTo()
    }
    if (target) {
      this.memory.actionMemory.target = target;
      this.memory.no_target = false;
    } else {
      this.memory.actionMemory.target = null;
      this.memory.no_target = true;
    }
  }
  attachWorker(){ 
    // TODO Make smart choice between spawn and reused
    if (this.memory.use_new_creep === false) {
      this.state('get_creep');
    } else if (Object.keys(Game.creeps).length < 2 || this.memory.use_new_creep === true) {
      this.state('spawn');
      this.memory.actionMemory.parts = this.memory.parts
    } else {
      this.state('get_creep');
    }
  }

  // State logic
  stateTransition(){
    // If no worker, get one.
    if (!this.worker()) {
      this.attachWorker();
    } else if (this.memory.no_target && this.state() !== 'wait') {
      this.state('wait');
    } else {
      if (this.worker().carry[RESOURCE_ENERGY] >= 50) {
        // If worker and energy, do work.
        this.state(this.work_state);
      } else {
        // If worker and no energy, get energy.
        this.state(this.energy_method)
      }
    }
  }
}

// Static Workers are simpler workers. They don't shuttle resources.
// They go to a resource and collect, dropping to the floor or into a container.
class TaskStaticWorker extends TaskWorker {
  constructor(memory) {
    // Workers get a default list of parts. May want to override.
    if (!memory.parts) memory.parts = [WORK, MOVE, WORK, MOVE, WORK, CARRY];
    super(memory);
    // Some actions handle static vs dynamic differently, eg for isComplete().
    memory.actionMemory.is_static = true;

    delete this.work_state; // This worker does no work. Just gathers resources.
    this.energy_method = null; // Where does this worker go for energy
  }

  // State logic
  stateTransition(){
    // If no worker, get one.
    if (!this.worker()) {
      this.attachWorker();
    } else {
      // Get resources. Always.
      this.state(this.energy_method)
    }
  }
}

// Harvester task. Harvest energy and move it to Spawns and Extensions.
class TaskHarvester extends TaskWorker {
  constructor(memory){
    memory.name = 'harvester';
    super(memory)
    this.work_state = 'fuel'
    this.energy_method = 'harvest'
  }
  findTargetFrom(){ return this.worker().pos.findClosestByPath(FIND_SOURCES).id; }
  findTargetTo() {
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
    return best ? best.id : null;
  }
}

// Static harvesters dump energy from a source onto the ground/container.
// Static harvesters will harvest indefinitely, ideally into a container.
// They don't carry resources back.
class TaskStatisHarvester extends TaskStaticWorker {
  constructor(memory){
    memory.name = 's_harvester';
    super(memory)
    this.energy_method = 'harvest'
  }
  findTargetFrom(){ return this.worker().pos.findClosestByPath(FIND_SOURCES).id; }
}

// Haulers are basically Harvesters except they go after dropped resources instead
// of harvesting it themselves.
class TaskHauler extends TaskHarvester {
  constructor(memory){
    super(memory)
    this.memory.name = 'hauler';
    this.work_state = 'fuel'
    this.energy_method = 'pickup'
  }
  findTargetFrom(){
    var r = this.worker().pos.findClosestByPath(FIND_DROPPED_ENERGY, {
      filter: (s)=>{return s.amount >= this.worker().carryCapacity}});
    if (!r) r = this.worker().pos.findClosestByPath(FIND_DROPPED_ENERGY);
    return (r ? r.id : null);
  }
}

// Upgrader task. Get energy and use it to upgrade the room controller.
class TaskUpgrader extends TaskWorker {
  constructor(memory){
    memory.name = 'upgrader';
    super(memory)
    this.work_state = 'upgrade'
    this.energy_method = 'withdraw'
  }
  findTargetFrom() {
    return this.worker().room.find(FIND_STRUCTURES, {filter: (s) => {return s.structureType === STRUCTURE_SPAWN}})[0].id;
  }
  findTargetTo() { return this.worker().room.controller.id; }
}

// Builder task. Take energy and use it to build construction sites.
class TaskBuilder extends TaskWorker {
  constructor(memory){
    memory.name = 'builder';
    if (!memory.parts) memory.parts = [MOVE, CARRY, WORK, WORK, MOVE, WORK, MOVE, CARRY];
    super(memory)
    this.work_state = 'build'
    this.energy_method = 'withdraw'
  }
  findTargetFrom() {
    return this.worker().room.find(FIND_STRUCTURES, {filter: (s) => {return s.structureType === STRUCTURE_SPAWN}})[0].id;
  }
  findTargetTo() {
      var targets = this.worker().room.find(FIND_CONSTRUCTION_SITES);
      return ((targets.length > 0) ? targets[0].id : null);
  }
}

module.exports = {
  upgrader: TaskUpgrader,
  harvester: TaskHarvester,
  s_harvester: TaskStatisHarvester,
  builder: TaskBuilder,
  hauler: TaskHauler,
  init: KTaskInit,
};

// vim:syntax=javascript:expandtab:ts=2:sw=2
