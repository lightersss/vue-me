import { reactive, effect } from "reactivity";
import { enQueueEffectFn, flushQueue } from "reactivity/scheduler";
import { computed } from "reactivity/computed";
const proxy = reactive({ a: 0, b: 1, isTrue: true });

// effect(
//   () => {
//     console.log(proxy.a);
//   },
//   {
//     scheduler: (fn) => {
//       enQueueEffectFn(fn);
//       flushQueue();
//     },
//   }
// );
// proxy.a = 1;
// proxy.a = 2;
// proxy.a = 3;
// proxy.a = 4;
const a = computed(() => {
  return proxy.a + proxy.b;
});
console.log(a.value); //第一次访问a.value，同时触发了响应式的依赖收集
//连续三次触发trigger，调用scheduler设置为过期数据
proxy.a = 2;
proxy.b = 3;
proxy.a = 4;
//再次访问，重新计算数值，执行computed的第一个参数（实际执行的是包装过的runner）
console.log(a.value);
console.log(a.value);
console.log(a.value);
console.log(a.value);
