var main = require('main');
Game = {time:0, spawns:{1:{id:1,canCreateCreep:function(){return -4}, spawning:false}}, creeps:{}, getObjectById: function(){}};
Memory = {};

function run() {
  main.loop();
  Game.time++;
  if (Game.time < 60) setTimeout(run, 1000);
}
run();
// vim:syntax=javascript:expandtab:ts=2:sw=2
