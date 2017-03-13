// The scheduler
//
// Start with a list of processes that need running.
// For each process, run(). Supply child process {pid:return_value}.
// Check if it is done. If yes, collect the return_value and drop the rest.
// Read tasks from the newProcQueue, shift to the process list and run until empty.
// Store new {pid:return_values}

// When it is done, it sets a done flag. Optionally, it can also set a return_value.
// At the end of each cycle, the scheduler will collect the return_values and delete the rest of the memory.
//   * introduce a destructor. prog_creep* can use this to suicide() any leftover creeps.
// The return_values will be loaded the next tick so other processes can read the values.
// After live processes run, the old return_values will be dropped to collect the new.

module.exports.loop = function () {
  // Kernel should do this, not the scheduler.
  if (!Memory.init) {
    Memory.init = true;
	
    Memory.processList = {};
    Memory.runTasks = true;
    LaunchProc('init');
  }
  runProcesses(Memory.processList);
}

/* *****
 * processList{          // A list of pid to process info
 *   pid:int => processInfo:object{
 *     pid:int           // The process ID
 *     usermemory:object // User space memory
 *     program:str       // program name
 *     ppid:int          // Parent PID
 *     state:enum        // Process state
 *     rc:object}}       // The return value the program quit with
 * *****/

/* *******
 * Run the process loop.
 *
 * For each running process, runProcess will:
 *  + Load program from file
 *  + Call program.run(memory) and handle syscalls (including exit)
 *
 * For dead processes, if the parent is in PROC_STATE_WAIT:
 *  + Wake up the parent with the RC.
 *  + Reap the child.
 * *******/
function runProcesses (processList) {
  var pids = Object.keys(processList);

  pids.forEach((pid) => {
    var proc = new Process(processList[pid]);

    switch (proc.state) {
      case PROC_STATE_DEAD:
        if (processList[proc.ppid].state === PROC_STATE_WAIT) {
          // add parent to the to-run queue for running
          // give it [SYSCALL_WAIT, child rc data]
          // reap/clean out the process
        }
        break;

      case PROC_STATE_WAIT:  // Waiting for a child proc
      case PROC_STATE_SUSP:  // Process is suspended
        break;

      case PROC_STATE_RUNNING:
        // Load up the binary.
        var program = require('program/' + proc.programName);
        // Stop running the proc for this tick?
        var stop = false;
        // First time we call the proc, it's because we started a tick
        var syscall_reply = [SYSCALL_TICK, null];

        // Run the program. Get the resulting syscall[operation, args].
        // Processes terminate by returning a syscall[SYSCALL_EXIT, rc].
        do {
          var syscall = program.run(proc.userMemory, syscall_reply);

          // System call handling
          switch (syscall[0]) {
            // Process is dead
            case SYSCALL_EXIT:
              proc.state = PROC_STATE_DEAD;
              // Store the RC for parental reaping
              proc.rc = syscall[1];
              delete proc.userMemory;
              stop = true; // Don't run again.
              break;

            // Process wants to launch a new program
            case SYSCALL_FORK:
              // Create a new process, put it into the to-run queue. Who sets up what where?
              var child_pid = launchNewProcess(pid, syscall[1]);
              // Add the new proc as a child to this one
              proc.children.push(child_pid);
              syscall_reply = [SYSCALL_FORK, child_pid];
              break;

            // Wait for a any child to terminate. For later, allow specifying a PID.
            // If we specific a child pid and the child is already dead,
            //  we can optimize to resume this tick. Not bothering.
            case SYSCALL_WAIT:
              proc.state = PROC_STATE_WAIT;
              stop = true;
              break;
              
            // Done for this tick. Work has been assigned.
            case SYSCALL_TICK:
              stop = true;
              break;
          }
        } while (!stop);
        break;
    }
  };

  // A way to run code from the console
  if (!Memory.do) return;
  switch (Memory.do) {
    case 0: utils.LaunchTask('init'); break;
    case 1: utils.LaunchTask('harvester', {use_new_creep: false}); break;
    case 2: utils.LaunchTask('harvester', {use_new_creep: true}); break;
    case 3: utils.LaunchTask('upgrader', {use_new_creep: true}); break;
    case 4: utils.LaunchTask('builder', {use_new_creep: true}); break;
    case 5: utils.LaunchTask('s_harvester', {use_new_creep: true}); break;
    case 6: utils.LaunchTask('hauler', {use_new_creep: true}); break;
    case
  }
  delete Memory.do;
}

// vim:syntax=javascript:expandtab:ts=2:sw=2
