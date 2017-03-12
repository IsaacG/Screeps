// TODO: Have the upgrader smart-select the source based on the energy?
// TODO: Figure out if we got unused creeps to use for a new role.
// TODO: Static harvester + hauler
// TODO: Fill extensions up
// TODO: Repairers
// TODO: static miners to go to other mines?
// TODO: Finer grain debug output (task, action, info, debug)
// TODO: Make builders stick to one thing?
// TODO: Haulers to collect from containers
// TODO: Static upgraders, feeders
// TODO: Have per-task-group start/stop (builders, upgraders)
// TODO: Add a process-layer wrapper between kernel and programs.
// TODO: Debugging with levels and the ability to enable per-thread or per-class.

var utils = require ('utils');
const Log = utils.Log;
const Debug = utils.Debug;
var ActionRegistry = require('actions');

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
class KTask_Init extends Task {
  run(){
    if (Object.keys(Memory.tasks).length === 1) {
      console.log('Only init running. Spawn harvester task.');
      utils.LaunchTask('harvester', {use_new_creep: true});
    }
  }
}

// Maintain a list of Creeps that are available to do work.
// Find Creeps that are the worker() of two Task_Worker threads.
class KTask_WorkerTracker extends Task {
}

// Generic task for workers.
class Task_Worker extends Task {
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
class Task_StaticWorker extends Task_Worker {
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
class Task_Harvester extends Task_Worker {
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
    // TODO fill extensions first
    creep.room.find(FIND_STRUCTURES).forEach((s)=>{
      // Find a spawn/extension which is not full.
      if (s.structureType !== STRUCTURE_EXTENSION && s.structureType !== STRUCTURE_SPAWN) return;
      if (s.energy === s.energyCapacity) return;
      if (best === null) {best = s; return;}
      if (best.structureType === STRUCTURE_SPAWN && s.structureType === STRUCTURE_EXTENSION) {
        best = s;
      } else if((best.energyCapacity - best.energy) < (s.energyCapacity - s.energy)) {
      // Select the one which needs the most to fill up.
        best = s;
      }
    });
    return best ? best.id : null;
  }
}

// Static harvesters dump energy from a source onto the ground/container.
// Static harvesters will harvest indefinitely, ideally into a container.
// They don't carry resources back.
class Task_StaticHarvester extends Task_StaticWorker {
  constructor(memory){
    memory.name = 's_harvester';
    super(memory)
    this.energy_method = 'harvest'
  }
  // TODO prefer to stand on a container
  findTargetFrom(){ return this.worker().pos.findClosestByPath(FIND_SOURCES).id; }
}

// Haulers are basically Harvesters except they go after dropped resources instead
// of harvesting it themselves.
class Task_Hauler extends Task_Harvester {
  constructor(memory){
    super(memory)
    this.memory.name = 'hauler';
    this.work_state = 'fuel'
    this.energy_method = 'pickup'
  }
  findTargetFrom(){
    // Find energy to collect. Prefer dropped that has at least enough to fill.
    // After that, go for containers. If those are all empty fal lback to any dropped.
    var r = this.worker().pos.findClosestByPath(FIND_DROPPED_ENERGY, {
      filter: (s)=>{return s.amount >= this.worker().carryCapacity}});
    if (!r) r = this.worker().pos.findClosestByPath(FIND_DROPPED_ENERGY);
    return (r ? r.id : null);
  }
}

// Upgrader task. Get energy and use it to upgrade the room controller.
class Task_Upgrader extends Task_Worker {
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
class Task_Builder extends Task_Worker {
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
      var best = null;
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
      this.worker().room.find(FIND_CONSTRUCTION_SITES).forEach((t) => {
        if (!best) {
          best = t;
        } else if (priorities[t.structureType] < priorities[best.structureType]) {
          // Select based off priorities. What about distance?
          best = t;
        } else if ((100 * t.progress / t.progressTotal) > (100 * best.progress / best.progressTotal)) {
          // Prefer something that's 25% more done already.
          best = t;
        }
      });
      return (best ? best.id : null);
  }
}

module.exports = {
  upgrader: Task_Upgrader,
  harvester: Task_Harvester,
  s_harvester: Task_StaticHarvester,
  builder: Task_Builder,
  hauler: Task_Hauler,
  init: KTask_Init,
};

// vim:syntax=javascript:expandtab:ts=2:sw=2
