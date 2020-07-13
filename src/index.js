const asyncHooks = require("async_hooks");

const contexts = {}
global._currentActive = {
  current: new Context({properties: {}, name:'root-context'})
}

asyncHooks.createHook({init, before, destroy}).enable();

function Context(spec, parent) {
  this.name = spec.name;
  this.properties = spec.properties;
  this.parent = parent;
}

Context.prototype.get = function (key) {
  let value = this.properties[key];
  if (typeof value === 'undefined' && this.parent) {
    // check with parents context
    value = this.parent.get(key);
  }
  return value;
}

Context.prototype.fork = function (spec) {
  return new Context(spec, this)
}

Context.prototype.withContext = function(cb) {
  const currentContext = this;
  const originalContext = _currentActive.current;
  function wrapped() {
    _currentActive.current = currentContext;
    try {
      return cb.apply(this, arguments)
    } finally {
      _currentActive.current = originalContext;
    }
  }
  return wrapped;
}

Context.prototype.runInContext = function(cb, thisArg, args) {
  const originalContext = _currentActive.current;
  _currentActive.current = this;
  try {
    return cb.apply(thisArg, args)
  } finally {
    _currentActive.current = originalContext;
  }
}

function init(asyncId, type, triggerId, resource) {
  contexts[asyncId] = _currentActive.current;
}

function before(asyncId) {
  _currentActive.current = contexts[asyncId];
}

function destroy(asyncId) {
  delete contexts[asyncId];
}
module.exports = Context;