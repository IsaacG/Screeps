/* *****
 * Spawn a creep for a job.
 *
 * Makes use of some shared memory library call to get access to the build queue and results.
 *
 * Takes a list of body parts and a priority.
 * Push the creep to a singleton build queue (with the PID).
 * Poll the creepBuilder's output for my PID.
 * When the builder is done building my creep (by PID), return the creep ID to the caller.
 * *****/

// vim:syntax=javascript:expandtab:ts=2:sw=2
