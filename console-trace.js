
/**
 * Module dependencies.
 */

var callsite = require('callsite')
  , tty = require('tty')
  , isatty = Boolean(tty.isatty() && process.stdout.getWindowSize)
  , defaultColors = { log: '90', error: '91', warn: '93', info: '96' }

console.traceOptions = Object.create(null);
console.traceOptions.cwd = process.cwd() + '/';
console.traceOptions.colors = true;

/**
 * Store custom options
 *
 * @param {Object} options
 * @api public
 */

module.exports = function (options) {
  if (options) {
    options.cwd = options.cwd || console.traceOptions.cwd;
    console.traceOptions = options;
  }
}

/**
 * Overrides the console methods.
 */

;['error', 'log', 'info', 'warn', 'trace'].forEach(function (name) {
  var fn = console[name];
  console[name] = function () {
    if(typeof arguments[0] === 'object') {
      arguments[0] = JSON.stringify(arguments[0], null, ' ');
    }
    if (console._trace || console.traceAlways) {
      arguments[0] = console.traceFormat(__stack[1], name) + arguments[0];
    }
    console._trace = false;
    return fn.apply(this, arguments);
  }
});

/**
 * Overridable formatting function.
 *
 * @param {CallSite}
 * @param {String} calling method
 * @api public
 */

console.traceFormat = function (call, method) {
  var basename = call.getFileName().replace(console.traceOptions.cwd, '')
    , str = '[' + basename + ':' + call.getLineNumber() + ']'
    , color = '99'

  if (!isatty) {
    return str;
  }

  if (console.traceOptions.colors !== false) {
    color = console.traceOptions.colors === true ? defaultColors[method] : console.traceOptions.colors[method];
  }

  if (console.traceOptions.right) {
    var rowWidth = process.stdout.getWindowSize()[0];
    return '\033[s' + // save current position
           '\033[' + rowWidth + 'D' + // move to the start of the line
           '\033[' + (rowWidth - str.length) + 'C' + // align right
           '\033[' + color + 'm' + str + '\033[39m' +
           '\033[u'; // restore current position
  } else {
    return '\033[' + color + 'm' + str + '\033[39m';
  }
}

/**
 * Adds trace getter to the `console` object.
 *
 * @api public
 */

function getter () {
  this._trace = true;
  return this;
}

console.__defineGetter__('t', getter);
console.__defineGetter__('traced', getter);
