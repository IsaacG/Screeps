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


/* *****
 * TODO
 * ====
 * Add an ALRM signal so that processes (running or sleeping) can be signalled?
 * Or some other way to timeout a WAIT. SIGUSR/HUP?
 * *****/

LogBase = require('log_base');

// Multiple process queues.
const Q_RUN = 0;   // Processes that are running.
const Q_WAIT = 1;  // Processes that are waiting on a child proc to die.
const Q_DEAD = 2;  // Processes that exited, waiting to be reaped.
const Q_NEW = 3;   // Processes that never got ran yet.
const Q_SUSP = 4;  // Processes that have been suspended.

const PROC_STATE = require('consts').proc_state;
const SYSCALL = require('consts').syscall;

// Represents the process info that the kernel needs to track.
class ProcessInfo extends LogBase {
  // m.pid          // Process ID
  // m.ppid         // Parent PID. Used for wait()ing/reaping/zombies.
  // m.user_memory  // The fiddly bits the userspace gets to play in.
  //                   Contains info needed in the userspace:  args:args
  // m.program      // Binary name to execute.
  // m.state        // Process state
  // m.returnValue  // Any type that the process wishes to return to the parent.
  constructor(m, kernel) {
    super();
    this.m = m;
    m.user_memory.pid = m.pid; // Share with the program
    this.kernel = kernel;
  }

  run(run_inputs) {
    // Load up the binary.
    try {
      let program_class = require('program/' + this.m.program + '.js');
      let program = new program_class(this.m.user_memory, this.kernel);
      return program.runner(run_inputs);
    } catch(e) {
      this.warn('Could not load program/' + this.m.program);
      this.warn(e);
      return [SYSCALL.FAULT, null];
    }
  }
}

class Scheduler extends LogBase {

  constructor(m, kernel) {
    super();
    this.m = m;
    this.kernel = kernel;
    this.purge_interval = 50;   // Ticks between zombie reaping.

    if (!m.process_queues) {
      m.process_queues = [{}, {}, {}, {}, {}];
      m.run_tasks = true;       // Run task scheduler?
      m.last_pid = 0;           // Track highest PID
    }
  }

  /* *******
   * Schedule running processes.
   *
   * First run all processes in Q_RUN.
   * Then move processes from Q_NEW to Q_RUN until no more.
   * *******/
  scheduleRunningProcesses() {
    let process_queues = this.m.process_queues;

    // Run init if we haven't yet. Move this into the kernel TODO.
    if (this.m.last_pid === 0) this.exec(0, 'init');

    // For each proc in Q_RUN, call runProcess().
    Object.keys(process_queues[Q_RUN]).forEach((pid) => {
      this.runProcess(process_queues, pid);
    });

    // Run procs newly put into Q_NEW until no new ones are found.
    while(Object.keys(process_queues[Q_NEW]).length !== 0) {
      Object.keys(process_queues[Q_NEW]).forEach((pid) => {
        // Move Q_NEW => Q_RUN
        process_queues[Q_RUN][pid] = process_queues[Q_NEW][pid];
        delete process_queues[Q_NEW][pid];

        // Run
        this.runProcess(process_queues, pid);
      });
    }

    // Purge zombie processes from Q_DEAD.
    if ((Game.time % this.purge_interval) === 0) {
      Object.keys(process_queues[Q_DEAD]).forEach((pid) => {
        let ppid = process_queues[Q_DEAD][pid].ppid;
        let hasParent = false;
        for (q in [Q_RUN, Q_WAIT, Q_SUSP]) {
          if (ppid in process_queues[q]) {
            hasParent = true;
            break;
          }
        }
        if (!hasParent) delete process_queues[Q_DEAD][pid];
      });
    }
  }


  // Launch a new process (fork+exec).
  exec(ppid, program, args) {
    let pid = ++this.m.last_pid;
    // ProcessInfo:
    let proc_m = {
      pid: pid,
      ppid: ppid,
      user_memory: {args: args},
      program: program,
      return_value: null,
    };
    // Queue it to run.
    this.m.process_queues[Q_NEW][pid] = proc_m;
    return pid;
  }

  runProcess(process_queues, pid) {
    var proc = new ProcessInfo(process_queues[Q_RUN][pid], this.kernel);

    // Stop running the proc for this tick?
    var stop = false;

    // First time we call the proc, it's because we started a tick
    var syscall_reply = [SYSCALL.TICK, null];

    // Run the process. Get the resulting syscall[operation, args].
    // Processes terminate by returning a syscall[SYSCALL.EXIT, rc].
    while (!stop) {
      var syscall;
      try {
        syscall = proc.run(syscall_reply);
      } catch(e) {
        this.warn('Error running process.');
        this.warn(proc);
        this.warn(e);
        stop = true;
      }

      // System call handling
      switch (syscall[0]) {

        // Process is dead.
        // If the parent is on Q_WAIT, immediately switch to it.
        // Otherwise, switch to Q_DEAD for eventual reaping.
        case SYSCALL.EXIT:
          proc.m.rc = syscall[1];
          this.info('Process ' + pid + ' exited, RC = ' + proc.m.rc);
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
            proc = new ProcessInfo(process_queues[Q_RUN][pid], this.kernel);
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

        // WAIT, BLOCK: get a child's RC. If BLOCK, wait for one to die. If not, return immediately with null or value.
        // Wait for any child to terminate.
        // If there is a dead child, immediately pick one and run with it. (There may be multiple.)
        // Otherwise, if BLOCK, switch to Q_WAIT. Else return null.
        case SYSCALL.WAIT:
          var blocking = syscall[1];
          var children = Object.keys(process_queues[Q_DEAD]).filter((p)=>{return process_queues[Q_DEAD][p].ppid === pid});
          this.info(`pid ${pid} called WAIT block=${blocking}, dead child count: ${children.length}`);
          if (children.length !== 0) {
            let c_pid = children[0];
            syscall_reply = [SYSCALL.WAIT, [c_pid, process_queues[Q_DEAD][c_pid].rc]];
            delete process_queues[Q_DEAD][c_pid];
          } else if (blocking) {
            var childExists = false;
            [Q_RUN, Q_NEW, Q_WAIT, Q_SUSP].forEach((q) => {
              Object.keys(process_queues[q]).forEach((p) => {
                this.info(`For ${pid} Q${q} p:${p} pp:${process_queues[q][p].ppid} => `);
                // Note == and not === because keys are strings.
                if (process_queues[q][p].ppid == pid) childExists = true;
              });
            });
            this.info(`pid ${pid} non-dead child exists: ${childExists}`);
            if (childExists) {
              // Shuffle to Q_WAIT.
              process_queues[Q_WAIT][pid] = process_queues[Q_RUN][pid];
              delete process_queues[Q_RUN][pid];
              stop = true;
            } else {
              // No child process. Nothing to wait for.
              syscall_reply = [SYSCALL.WAIT, null];
            }
          } else {
            syscall_reply = [SYSCALL.WAIT, null];
          }
          break;

        // Process wants to launch a new program
        case SYSCALL.EXEC:
          // Create a new process, put it into the to-run queue. Who sets up what where?
          var child_pid = this.exec(pid, syscall[1], syscall[2]);
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
    }
  }


}

function loop (kernel) {
  if (!kernel.m.scheduler) kernel.m.scheduler = {};
  kernel.scheduler = new Scheduler(kernel.m.scheduler, kernel);
  kernel.scheduler.scheduleRunningProcesses();
}

module.exports = loop;
// vim:syntax=javascript:expandtab:ts=2:sw=2
