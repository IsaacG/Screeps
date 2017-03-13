// ///////////////
// General high level process object.
//
// A process will be ran by the scheduler and initialized with a block of memory.
//
// A process is constructed with some memory.
// It is run() each tick.
// When it is done, it sets a done flag. Optionally, it can also set a return_value.
// At the end of each cycle, the scheduler will collect the return_values and delete the rest of the memory.
//   * introduce a destructor. prog_creep* can use this to suicide() any leftover creeps.
// The return_values will be loaded the next tick so other processes can read the values.
// After live processes run, the old return_values will be dropped to collect the new.
//
// Some utility functions:
//   * every(ticks, function): use thread ID to stagger. Run code if (((Game.time + pid) % ticks) == 0)
//   * debug(msg): call logger.log(DEBUG, pid, msg)
//   * log(msg): call logger.log(INFO, pid, msg)
//   * warn(msg): call logger.log(WARN, pid, msg)
//   * error(msg): call logger.log(ERROR, pid, msg)
// 
