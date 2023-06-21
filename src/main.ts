import { reactive, effect } from "reactivity";
import { enQueueEffectFn, flushQueue } from "reactivity/scheduler";
const proxy = reactive({ a: 0, b: 1, isTrue: true });

effect(
  () => {
    console.log(proxy.a);
  },
  {
    scheduler: (fn) => {
      enQueueEffectFn(fn);
      flushQueue();
    },
  }
);
proxy.a = 1;
proxy.a = 4;
proxy.a = 3;
proxy.a = 2;
