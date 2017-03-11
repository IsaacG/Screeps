// Log messages but only if we haven't logged something identical in the last 10 ticks.
module.exports.Log = function(s) {
  if (Memory.lastLog === undefined) Memory.lastLog = {};
  // if (s in Memory.lastLog && ((Game.time - Memory.lastLog[s]) < 10)) return;
  Memory.lastLog[s] = Game.time;
  console.log(Game.time + ": " + s);
  if((Game.time%50)===0){
    old = Game.time - 50;
    Object.keys(Memory.lastLog).forEach((s)=>{if(Memory.lastLog[s]<old)delete Memory.lastLog[s]});
  }
}

module.exports.LaunchTask = function(name, memory) {
  tId = Memory.kernel.tId++
  if (!memory) memory = {}
  memory.taskId = tId
  memory.taskName = name
  Memory.tasks[tId] = memory
}

function Debug(s) {if(Memory.debug) Log(s)}


// vim:syntax=javascript:expandtab:ts=2:sw=2
