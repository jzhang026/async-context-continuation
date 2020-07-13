require("../src/index");
// a.js file
let callback = require("./b.js");
function foo() {
  setTimeout(callback, 100);
}

let c = _currentActive.current.fork({ properties: { a: 5 } });
c.runInContext(foo);
