import { createReactive } from "./reactive";
const ref = <T>(value: T) => {
  const obj = {
    value,
  };
  Object.defineProperty(obj, "__isRef__", {
    enumerable: false,
    value: true,
    configurable: false,
    writable: false,
  });
  const res = createReactive(obj);
  return res;
};

const toRef = (obj: Record<string | symbol, unknown>, key: string | symbol) => {
  const res = {
    get value() {
      return obj[key];
    },
    set value(newValue) {
      obj[key] = newValue;
    },
  };
  Object.defineProperty(obj, "__isRef__", {
    enumerable: false,
    value: true,
    configurable: false,
    writable: false,
  });
  return res;
};

export const toRefs = (obj: Record<string | symbol, unknown>) => {
  const res: Record<string | symbol, unknown> = {};
  for (let key in obj) {
    res[key] = toRef(obj, key);
  }
  return res;
};

export default ref;
