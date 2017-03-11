global.ex = (x) => JSON.stringify(x, null, 2);    // explain
global.stop = () => Memory.runTasks = false; // Stop running tasks
global.start = () => Memory.runTasks = true; // Start running tasks
global.debug = (x) => Memory.debug = x; // Set debugging output
global.kill = (x) => delete Memory.tasks[x]; // Kill a thread by ID
global.killall = () => Memory.tasks = {}; // Wipe out all threads.
global.ps = () => global.ex(Memory.tasks); // Show threads.
global.mdo = (x) => Memory.do = x; // Show threads.
global.tid = () => Object.keys(Memory.tasks); // Show thread IDs
global.running = () => Object.keys(Memory.tasks).map( (p,c) => {return `[${p} ${Memory.tasks[p].name}:${Memory.tasks[p].state}]`});
global.worker = (x) => Game.getObjectById(global.task(x).worker)
global.task = (x) => Memory.tasks[x]
global.show = (x) => global.ex(global.task(x))
global.susp = (x) => global.task(x).pause = true
global.cont = (x) => global.task(x).pause = false
// vim:syntax=javascript:expandtab:ts=2:sw=2
