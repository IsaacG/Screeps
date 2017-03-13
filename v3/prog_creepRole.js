// Generic program to be inherited by creepRole type programs.
//
// Store the creep in the constructor. Delete the creep in the destructor.
//
// ... creepWorkerRole
// 
// FSM : { taskName : { doneTask:func, doTask:func, getNextTask:func }, [ ... ] }
// runStateMachine ( with FSM[task]: while (!doneTask) doTask; state = getNextTask )
//
// if has FSM: runStateMachine()
// else run()
