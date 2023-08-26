import { effect, track, trigger } from "./effect";

export function computed<T>(getter: () => T): { value: T } {
  let prevValue: T;
  let outDate = true;

  const effecFn = effect(getter, {
    lazy: true,
    scheduler() {
      /**
       * 由于lazy为true，所以computed的调用不会创建响应式数据的关联
       * 当执行了obj.value后，才会构建响应式
       * scheduler在每次trigger执行时被调用，只负责将过期的标志位置为false，不执行具体的计算函数，达到了懒计算的目的
       * 计算函数在obj的 get方法中执行，执行的过程中拿到的都是最新值，因此可以实现更新
       */
      console.log("computed依赖项改变，outDate：", outDate);
      if (!outDate) {
        outDate = true;
        trigger(obj, "value");
      }
    },
  });

  const obj = {
    get value() {
      if (outDate) {
        console.log("computed重新计算");
        prevValue = effecFn?.runner();
        outDate = false;
      }
      track(obj, "value");
      return prevValue;
    },
  };

  return obj;
}
