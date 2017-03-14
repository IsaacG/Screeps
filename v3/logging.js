// Logging module
//
// Use to log output.
// Calls to log will come attached with a log level, pid and program name.
// Logging can be enabled by setting:
// * global log levels
// * per-process log levels
// * per-program log levels

module.exports.Log = (s) => console.log(s);
