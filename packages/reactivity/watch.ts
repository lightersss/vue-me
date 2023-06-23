import { effect } from "./effect";
type data<T> = (T extends Object ? T : never) | (() => T);
type callback<T> = (
  newValue: T,
  oldValue: T,
  onNextCallbackRun: (fn: () => void) => void
) => any;
type watchoptions = {
  immediate?: boolean;
  order: "pre" | "post";
};

const ResolvedPromise = Promise.resolve();

export const watch = <T>(
  data: data<T>,
  callback: callback<T>,
  options?: watchoptions
) => {
  let getter;
  let newValue: T, oldValue: T;

  if (typeof data === "function") {
    getter = data;
  } else {
    getter = () => {
      return travel(data);
    };
  }

  //在给watch添加回调函数时会存在竞态
  //即可能下一个回调执行时，上一个回调还没有执行
  //通过在注册回调时给定registerNextCallbackRun，来注册下一个回调执行时 所执行的回调

  let nextCallbackRunCallback: undefined | (() => void);
  const registerNextCallbackRun = (fn: () => void) => {
    nextCallbackRunCallback = fn;
  };

  const scheduler = () => {
    const schedulerJob = () => {
      newValue = effecFn?.runner();
      nextCallbackRunCallback?.();
      callback(newValue, oldValue, registerNextCallbackRun);
      oldValue = newValue;
    };

    if (options?.order === "post") {
      ResolvedPromise.then(() => {
        schedulerJob();
      });
      return;
    }

    schedulerJob();
  };

  const effecFn = effect(getter, {
    lazy: true,
    scheduler,
  });

  if (options?.immediate) {
    scheduler();
  } else {
    oldValue = effecFn?.runner();
  }
};

const travel = (data: unknown, visited = new WeakSet()) => {
  if (typeof data !== "object" || data === null || visited.has(data)) {
    return data;
  }
  visited.add(data);
  for (const key in data) {
    let key1 = key as keyof typeof data;
    travel(data[key1], visited);
  }
  return data;
};
