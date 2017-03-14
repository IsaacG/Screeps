// States a process can occupy.
const PROC_STATE = {
  NOT_STARTED: 'NOT_STARTED',
  RUNNING: 'RUNNING',
  WAIT: 'WAIT',
  DEAD: 'DEAD',
  TICK: 'TICK',
  SUSP: 'SUSP'
}

// System calls
const SYSCALL = {
  TICK: 'TICK',
  EXEC: 'EXEC',
  EXIT: 'EXIT',
  WAIT: 'WAIT',
  FAULT: 'FAULT',
}

module.exports.syscall = SYSCALL;
module.exports.proc_state = PROC_STATE;
