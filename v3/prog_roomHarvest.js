// Top level program that controlls the room harvesters.
//
// If we don't have a static harvester plus associated hauler in place, launch a simple harvester.
// If we got a simple harvester, assign one static_harvester per source (on container, if there is one).
// Assign one hauler for each harvester.
// Track all of what's going on. Simple harvester, source=>static_harvester=>hauler (pids).
// Re-run static_harvester and hauler on exit
