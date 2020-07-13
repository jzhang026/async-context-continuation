# Async Context Continuation

When we execute some async code in javascript. The async callback function will lost the execution context of the main thread.
We always using closure like below to make it possible for async callback to access the variable in main thread.

```javascript
function foo() {
  let localVariable = 5;
  setTimeout(function callback() {
    console.log(localVariable); // -> this is accessed through closure
  }, 100);
}

foo();
// 5
```

However, if the code is in separate modules. how could we make the context in main thread to be accessed by async call back.

```javascript
// a.js file
let callback = require("./b.js");
function foo() {
  let someContext = {
    /* some data */
  };
  setTimeout(callback, 100);
}
```

```javascript
// b.js file
function callback() {
  let someContext; // -> how can we get `someContext` in the execution context of foo
  console.log(someContext);
}
```

### under the hood

the context continuation is based on [async hooks](https://nodejs.org/docs/latest-v12.x/api/async_hooks.html), which is first introduced into nodeJS version 8.

### how to use

```javascript
// a.js file
require("../src/index");
// a.js file
let callback = require("./b.js");
function foo() {
  setTimeout(callback, 100);
}
let c = _currentActive.current.fork({ properties: { a: 5 } });
c.runInContext(foo);
```

```javascript
// b.js file
function callback() {
  let data = _currentActive.current.get("a");
  console.log(data); // -> print out 5
}
module.exports = callback;
```

### supported asynchronous call:

1. `setTimeout`
2. `setImmediate`
3. `setInterval`
4. `process.nextTick`
5. `native promise`
