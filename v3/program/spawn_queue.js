// Collection of programs to handle spawning creeps.
// Use a global object (via some OS-level getter/setter) to have a single queue.
//
// spawnCreep: regular program but requires global queue access.
//   * pushes a spawnRequest {parts, minParts, pid} to the queue. Requires special access to global queue.
//   * poll for create result record
//   * when this pid shows up with a creep_id, exit and return creep_id
//
// spawner
//   * one instance (managed by init)
//   * works on single requests (per spawn)
//   * pop req, wait for canCreate, create, record a pid:creep_id record (one per spawn per tick, max)
//   * side job: clear out old values from Memory.creeps


// Use priority queues?
