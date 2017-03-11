global.ex = (x) => JSON.stringify(x, null, 2);    // explain
global.stop = () => Memory.runTasks = false; // Stop running tasks
global.start = () => Memory.runTasks = true; // Start running tasks
global.debug = (x) => Memory.debug = x; // Set debugging output

// vim:syntax=javascript:expandtab:ts=2:sw=2
