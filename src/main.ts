import { reactive, effect } from "reactivity";

const proxy = reactive({ a: 0, b: 1, isTrue: true });

effect(() => {
  console.log(proxy.isTrue ? proxy.a : proxy.b);
});
proxy.a = 1;
proxy.b = 2;
proxy.isTrue = false;
