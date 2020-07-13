const fs = require("fs");
require("../src/index");
// const promisify = function(fn) {
//   let resolve;
//   let reject;
//   let promise = new Promise((res, rej) => {
//     resolve =res;
//     reject = rej;
//   })
//   return function() {
//     return fn.apply(this, arguments)
//   }
// }
const c = _currentActive.current.fork({
  name: "child_context",
  properties: { a: 5 },
});

describe("wrap and propagate async context", function () {
  it("can not access context outof withContext", (done) => {
    expect(_currentActive.current.get("a")).toBe(undefined);
    fs.stat(".", function (err, stats) {
      expect(_currentActive.current.get("a")).toBe(undefined);
      done();
    });
    expect(_currentActive.current.get("a")).toBe(undefined);
  });

  it("withContext should work and pass context to its child", (done) => {
    fs.stat(
      ".",
      c.withContext(function () {
        expect(_currentActive.current.get("a")).toBe(5);
        fs.stat("~/", function () {
          // async child call should be able to access parent context
          expect(_currentActive.current.get("a")).toBe(5);
          done();
        });
      })
    );
  });
});

describe("runInContext", function () {
  it("runInContext", () => {
    const result = c.runInContext(
      function (i) {
        expect(_currentActive.current.get("a")).toBe(5);
        return i;
      },
      undefined,
      [12]
    );
    expect(_currentActive.current.get("a")).toBe(undefined);
    expect(result).toBe(12);
  });
});

describe("nested context", function () {
  it("access properties form context chain", (done) => {
    let cc = c.fork({ properties: { b: 6 } });
    cc.runInContext(function () {
      setTimeout(() => {
        expect(_currentActive.current.get("b")).toBe(6);
        expect(_currentActive.current.get("a")).toBe(5);
        done();
      }, 100);
    });
  });
});

describe("test native promise", function () {
  it("propogate context to promise reaction callback", (done) => {
    let a = new Promise((res) => {
      setTimeout(() => res(7), 100);
    });
    c.runInContext(() =>
      a
        .then((res) => {
          expect(res).toBe(7);
          expect(_currentActive.current.get("a")).toBe(5);
        })
        .then(() => {
          expect(_currentActive.current.get("a")).toBe(5);
          done();
        })
    );
  });
});
