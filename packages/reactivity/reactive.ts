import { track, trigger } from "./effect";

export const reactive = <T extends Object>(data: T) => {
  const res = new Proxy(data, {
    get(target, prop) {
      track(target, prop);
      return Reflect.get(target, prop);
    },
    set(target, prop, value) {
      const res = Reflect.set(target, prop, value);
      trigger(target, prop);
      return res;
    },
  });
  return res;
};
