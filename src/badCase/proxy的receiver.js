const obj = {
  foo: 1,
  get bar() {
    return this.foo;
  },
};

const proxy1 = new Proxy(obj, {
  get(target, key, receiver) {
    console.log("receiver1", receiver);
    return target[key];
  },
});

const proxy2 = new Proxy(obj, {
  get(target, key, receiver) {
    console.log("receiver2", receiver, key);

    return Reflect.get(target, key, receiver);
  },
});

console.log(proxy2.foo);
console.log(proxy2.bar);
