
Game = {time:0, spawns:{1:{id:1,canCreateCreep:function(){return -4}, spawning:false}}, creeps:{}, getObjectById: function(){}};
Memory = {}
var s = require('scheduler');

function run() {
  console.log('Game Time = ' + Game.time++);
  s.loop();
  if (Game.time < 20) setTimeout(run, 1000);
}
run();
