
Game = {
  time:0,
  spawns: {
    'Spawn1': {
      id:12345,
      canCreateCreep:function(){return -4},
      spawning:false,
      name: 'Spawn1',
    }
  },
  rooms : {
    W5N8: {
      name: 'W5N8'
    }
  },
  creeps:{},
  getObjectById: function(){}
};

Memory = {}
Memory.log = {level: 1, klass: 'Scheduler', pid: 0};
var s = require('main');

function run() {
  console.log('==== ' + Game.time++ + ' ====');
  s.loop();
  if (Game.time < 20) setTimeout(run, 2000);
}
run();

// vim:syntax=javascript:expandtab:ts=2:sw=2
