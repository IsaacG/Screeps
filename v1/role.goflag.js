var roleBuilder = require('role.builder');

var role = {
  run: function(creep) {
    if (creep.memory.gotThere) {
     return roleBuilder.run(creep);
    } else {
      let flag = Game.flags['Flag1'];
      creep.moveTo(flag);
      if (creep.pos.isEqualTo(flag.pos)) creep.memory.gotThere = true;
    }
  }
}

module.exports = role;
// vim:syntax=javascript:expandtab:ts=2:sw=2
