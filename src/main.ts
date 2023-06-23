import { reactive } from "reactivity";
import { watch } from "reactivity/watch";
const proxy = reactive({ a: 0, b: 1, isTrue: true });
watch(
  () => proxy.a + proxy.b,
  (cur, prev, onNextCallbackRun) => {
    onNextCallbackRun(() => {
      console.log("onNextCallbackRun");
    });
    console.log("改变了");
    console.log("old:", prev);
    console.log("new:", cur);
    console.log(proxy.a, proxy.b, proxy.isTrue);
  }
);
proxy.a = 3;
proxy.a = 5;
