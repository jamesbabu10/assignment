const { handleError } = require('./handler');

process.on('uncaughtException', (err) => {
  err.controller = 'uncaughtException';
  handleError(err);
});