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

const Log = require('logging').Log;

// Multiple process queues.
const Q_RUN = 0;   // Processes that are running.
const Q_WAIT = 1;  // Processes that are waiting on a child proc to die.
const Q_DEAD = 2;  // Processes that exited, waiting to be reaped.
const Q_NEW = 3;   // Processes that never got ran yet.
const Q_SUSP = 4;  // Processes that have been suspended.

module.exports.loop = function () {
  // Kernel should do this, not the scheduler.
  if (!Memory.init) {
    Memory.init = true;
	
    // Multiple process queues.
    // Impro
    Memory.process_queues = [{}, {}, {}, {}, {}];
    Memory.run_tasks = true;       // Run task scheduler?
    Memory.last_pid = 0;           // Track highest PID
    Exec(0, 'init');               // Kick things off with init
  }
  scheduler(Memory.process_queues); // Run the process scheduler
}

let PROC_STATE = require('consts').proc_state;
let SYSCALL = require('consts').syscall;

// Represents the process info that the kernel needs to track.
class ProcessInfo {
  // m.pid          // Process ID
  // m.ppid         // Parent PID. Used for wait()ing/reaping/zombies.
  // m.user_memory  // The fiddly bits the userspace gets to play in. Contains args:args.
  // m.program      // Binary name to execute.
  // m.state        // Process state
  // m.returnValue  // Any type that the process wishes to return to the parent.
  constructor(m) { this.m = m; }

  run(syscall_reply) {
    // Load up the binary.
    try {
      var program = require('program/' + this.m.program + '.js');
      return new program(this.m.user_memory).runner(syscall_reply);
    } catch(e) {
      Log('Could not load program/' + this.m.program);
      Log(e);
      return [SYSCALL.FAULT, null];
    }
  }
}

// Launch a new process (fork+exec).
function Exec(ppid, program, args) {
  let pid = ++Memory.last_pid;
  let proc = new ProcessInfo({
    pid: pid,
    ppid: ppid,
    user_memory: {args: args},
    program: program,
    return_value: null,
  });
  // Queue it to run.
  Memory.process_queues[Q_NEW][pid] = proc.m;
  return pid;
}


function runProcess(process_queues, pid) {
  var proc = new ProcessInfo(process_queues[Q_RUN][pid]);

  // Stop running the proc for this tick?
  var stop = false;

  // First time we call the proc, it's because we started a tick
  var syscall_reply = [SYSCALL.TICK, null];

  // Run the process. Get the resulting syscall[operation, args].
  // Processes terminate by returning a syscall[SYSCALL.EXIT, rc].
  do {
    var syscall;
    try {
      syscall = proc.run(syscall_reply);
    } catch(e) {
      Log('Error running process.');
      Log(proc);
      Log(e);
      stop = true;
    }

    // System call handling
    switch (syscall[0]) {
      // Process is dead.
      // If the parent is on Q_WAIT, immediately switch to it.
      // Otherwise, switch to Q_DEAD for eventual reaping.
      case SYSCALL.EXIT:
        proc.m.rc = syscall[1];
        Log('Process ' + pid + ' exited, RC = ' + proc.m.rc);
        // If the parent is waiting for us,
        //  delete this process
        //  wake the parent
        //  pass rc to the parent
        // Otherwise, queue it up in Q_DEAD.
        var ppid = proc.m.ppid;
        if (ppid in process_queues[Q_WAIT]) {
          // Reset the context piece by piece so when we loop, it's the parent that runs,
          // getting the child's pid:rc.

          // Use the child info for form the reply.
          syscall_reply = [SYSCALL.WAIT, [pid, proc.m.rc]];
          delete process_queues[Q_RUN][pid];
          // Move the parent from Q_WAIT to Q_RUN. 
          process_queues[Q_RUN][ppid] = process_queues[Q_WAIT][ppid];
          delete process_queues[Q_WAIT][ppid];

          // Switch the running context to point to the parent in order to
          // wake the parent up and get it running.
          pid = ppid;
          proc = new ProcessInfo(process_queues[Q_RUN][pid]);
        } else if (ppid in process_queues[Q_RUN] || ppid in process_queues[Q_SUSP]) {
          // Parent is not waiting. Shuffle into Q_DEAD.
          process_queues[Q_DEAD][pid] = process_queues[Q_RUN][pid];
          delete process_queues[Q_RUN][pid];
          stop = true;
        } else {
          // No parent. Reap the orphan.
          delete process_queues[Q_RUN][pid];
          stop = true;
        }

        break;

      // Wait for any child to terminate.
      // If there is a dead child, immediately pick one and run with it. (There may be multiple.)
      // Otherwise, switch to Q_WAIT.
      case SYSCALL.WAIT:
        var children = Object.keys(process_queues[Q_DEAD]).filter((p)=>{return process_queues[Q_DEAD][p].ppid === pid});
        if (children.length !== 0) {
          let c_pid = children[0];
          syscall_reply = [SYSCALL.WAIT, [c_pid, process_queues[Q_DEAD][c_pid].rc]];
          delete process_queues[Q_DEAD][c_pid];
        } else {
          var childExists = false;
          for (q in [Q_RUN, Q_NEW, Q_WAIT, Q_SUSP]) {
            if (Object.keys(process_queues[q]).filter((p)=>{return process_queues[q][p].ppid === pid}).length !== 0) {
              childExists = true;
              break;
            }
          }
          if (childExists) {
            // Shuffle to Q_WAIT.
            process_queues[Q_WAIT][pid] = process_queues[Q_RUN][pid];
            delete process_queues[Q_RUN][pid];
            stop = true;
          } else {
            // No child process. Nothing to wait for.
            syscall_reply = [SYSCALL.WAIT, null];
          }
        }
        break;
        
      // Process wants to launch a new program
      case SYSCALL.EXEC:
        // Create a new process, put it into the to-run queue. Who sets up what where?
        var child_pid = Exec(pid, syscall[1].shift(), syscall[1]);
        // Add the new proc as a child to this one
        syscall_reply = [SYSCALL.EXEC, child_pid];
        break;

      // Done for this tick. Work has been assigned.
      case SYSCALL.TICK:
        stop = true;
        break;

      case SYSCALL.FAULT:
        stop = true;
        break;

      default:
        Error('Unknown sys call ' + syscall[0]);
        stop = true;
        break;
    }
  } while (!stop);
}


/* *******
 * Run the process loop.
 *
 * For each running process, runProcess will:
 *  + Run the process and handle syscalls (including exit)
 *
 * For dead processes, if the parent is in PROC_STATE.WAIT:
 *  + Wake up the parent with the RC.
 *  + Reap the child.
 * *******/
function scheduler(process_queues) {
  var pids = Object.keys(process_queues[Q_RUN]);

  pids.forEach((pid) => {
    runProcess(process_queues, pid);
  });
  // Move process from Q_NEW to Q_RUN until no new processes get queued.
  // The newly scheduled processes may spawn children so we need a while() loop.
  while(Object.keys(process_queues[Q_NEW]).length !== 0) {
    Object.keys(process_queues[Q_NEW]).forEach((pid) => {
      // Move the process from Q_NEW to Q_RUN
      process_queues[Q_RUN][pid] = process_queues[Q_NEW][pid];
      delete process_queues[Q_NEW][pid];

      // Run
      runProcess(process_queues, pid);
    });
  }

  // Occasionally delete processes from Q_DEAD if the ppid is gone.
  if ((Game.time % 20) === 0) {
    Object.keys(process_queues[Q_DEAD]).forEach((pid) => {
      var hasParent = false;
      var ppid = process_queues[Q_DEAD][pid].ppid;
      for (q in [Q_RUN, Q_WAIT, Q_SUSP]) {
        if (ppid in process_queues[q]) {
          hasParent = true;
          break;
        }
      }
      if (!hasParent) delete process_queues[Q_DEAD][pid];
    });
  }

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
  }
  delete Memory.do;
}

// vim:syntax=javascript:expandtab:ts=2:sw=2
