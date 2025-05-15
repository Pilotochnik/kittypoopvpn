// Shim для process.browser
const process = {
  env: {},
  browser: true,
  version: '',
  versions: {},
  nextTick: function(cb) {
    setTimeout(cb, 0);
  }
};

module.exports = process; 