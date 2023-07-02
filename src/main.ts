import { effect, reactive, readOnly, shallowReadOnly } from "reactivity";
const proxy = readOnly({
  a: 0,
  b: 1,
  obj: {
    c: 2,
  },
});

effect(() => {
  console.log(proxy.obj.c);
});
proxy.obj.c = 5;
console.log(proxy);
