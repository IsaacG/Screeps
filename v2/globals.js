// Debugging diagnostics
global.ex = (x) => JSON.stringify(x, null, 2);    // explain

// Global behaviour switches
global.stop = () => Memory.runTasks = false; // Stop running tasks
global.start = () => Memory.runTasks = true; // Start running tasks
global.debug = (x) => Memory.debug = x; // Set debugging output

// Thread management - lower level
global.kill = (x) => delete Memory.tasks[x]; // Kill a thread by ID
global.killall = () => Memory.tasks = {}; // Wipe out all threads.
global.dump = () => global.ex(Memory.tasks); // Show all threads and memory
global.tid = () => Object.keys(Memory.tasks); // Show thread IDs
// Summary of running tasks
global.ps = () => Object.keys(Memory.tasks).map( (p,c) => {return `[${p} ${Memory.tasks[p].name}:${Memory.tasks[p].state}]`});
global.susp = (x) => global.task(x).pause = true // Suspend a task
global.cont = (x) => global.task(x).pause = false // Continue a task

// Thread helpers
global.show = (x) => global.ex(global.task(x)) // Show the memory of a task
global.mdo = (x) => Memory.do = x; // Trigger to launch some snipper
global.worker = (x) => Game.getObjectById(global.task(x).worker) // Fetch a worker from a thread
global.task = (x) => Memory.tasks[x] // Task's memory
// Kill off a thread and its worker
global.suicide = (x) => {global.susp(x); global.worker(x) && global.worker(x).suicide(); global.kill(x);}

// vim:syntax=javascript:expandtab:ts=2:sw=2
