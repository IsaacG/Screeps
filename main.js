require ('globals.js');
var utils = require ('utils.js');
const Log = utils.Log;
const Debug = utils.Debug;
var TaskHash = require('tasks.js');

module.exports.loop = function () {
  if (!Memory.kernel) {
    Memory.kernel = {tId: 1}
    Memory.addTask = []
    Memory.tasks = {}
    Memory.runTasks = true
    utils.LaunchTask('init');
  }

  Object.keys(Memory.tasks).forEach((tId) => {
    var m = Memory.tasks[tId]
    if (m.pause) return;
    var taskName = m.name
    var taskId = m.taskId
    if (!TaskHash[taskName]) {
      Log(`Invalid taskName[${taskName}] not in TaskHash. Deleting ${taskId}.`);
      delete Memory.tasks[taskId];
      return
    }
    var task = new TaskHash[taskName](m)
    if (Memory.runTasks) {
      Debug('Run ' + task.string())
      task.run()
    }
  });

  // A way to run code from the console
  if (Memory.do !== undefined) {
    if (Memory.do === 0) utils.LaunchTask('init');
    if (Memory.do === 1) utils.LaunchTask('harvester', {use_new_creep: false});
    if (Memory.do === 2) utils.LaunchTask('harvester', {use_new_creep: true});
    if (Memory.do === 3) utils.LaunchTask('upgrader', {use_new_creep: true});
    if (Memory.do === 4) utils.LaunchTask('builder', {use_new_creep: true});
    if (Memory.do === 5) utils.LaunchTask('s_harvester', {use_new_creep: true});
    if (Memory.do === 6) utils.LaunchTask('hauler', {use_new_creep: true});
    Memory.lastLog = {};
    delete Memory.do;
  }
}

// vim:syntax=javascript:expandtab:ts=2:sw=2
