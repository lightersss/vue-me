import { reactive, effect } from "reactivity";

const proxy = reactive({ a: 0 });

effect(() => {
  console.log(proxy.a);
});
proxy.a = 1;
