# Changes with the current design

## Task (ie program) related things that need to change

* Have the upgrader smart-select the source based on the energy?
* Figure out if we got unused creeps to use for a new role.
* Static harvester + hauler
* Fill extensions up
* Repairers
* static miners to go to other mines?
* Finer grain debug output (task, action, info, debug)
* Make builders stick to one thing?
* Haulers to collect from containers
* Static upgraders, feeders
* Have per-task-group start/stop (builders, upgraders)
* Add a process-layer wrapper between kernel and programs.
* Debugging with levels and the ability to enable per-thread or per-class.
* Task_Worker.attachWorker() can decide smartly between spawn vs reuse
* Task_StaticWorker can prefer standing on a container when a container spot is open.
* Get all units away from the Spawn when done

# New design ideas and bits

Redoing the design to improve bits and pieces.

* Worker programs should exit when their creep dies.
* Have a program that is higher level, tasked with managing the workers.
  * It can tell when a process has ended and respawn if needed (workers)
  * It should be managing which basic workers are out there and in what order.
* Processes have a labeled list of processes they started. Helper function that spawns new label:(program, options) if label is empty.
* Clean up spawning into a spawn queue.
* Programs that need spawns should get it passed in.
* More helper functions. More object-like.

