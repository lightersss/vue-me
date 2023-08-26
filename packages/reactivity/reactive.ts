import { TRIGGER_TYPE, track, trigger } from "./effect";

export enum TRACK_KEYS {
  ITERATE_KEY = "ITERATE_KEY",
}

type reactiveOptions = {
  isShallow?: boolean;
  isReadOnly?: boolean;
};
export const createReactive = <T extends object>(
  data: T,
  options?: reactiveOptions
): T => {
  const { isShallow = false, isReadOnly = false } = options ?? {};
  return new Proxy(data, {
    get(target, prop, receiver) {
      /**
       * raw用于记录这个proxy代理的原始对象
       * 而 receiver 则是这个 Proxy 实例
       * 当访问 proxy.RAW时，实则返回原始对象
       * 需结合trigger使用
       */
      if (prop === "RAW") {
        return target;
      }
      if (!isReadOnly) {
        track(target, prop);
      }
      const _res = Reflect.get(target, prop, receiver);
      if (isObject(_res) && !isShallow) {
        return createReactive(_res, options);
      }
      return _res;
    },
    set(target, prop, value, receiver) {
      if (isReadOnly) {
        console.error("只读");
        return true;
      }
      const isShouldTigger = shouldTigger(target, prop, value, receiver);
      const _res = Reflect.set(target, prop, value, receiver);
      if (isShouldTigger) {
        const triggerType = getTriggerType(target as object, prop);
        trigger(target, prop, triggerType);
      }

      return _res;
    },
    ownKeys(target) {
      //用于处理for in的情况
      //ownKeys与get、set方法不同,ownKeys没有指定具体的key，因此在track时我们需要指定一个Key
      track(target, TRACK_KEYS.ITERATE_KEY);
      return Reflect.ownKeys(target);
    },
    deleteProperty(target, p) {
      const hasKey = Object.prototype.hasOwnProperty.call(target, p);
      const deleteRes = Reflect.deleteProperty(target, p);
      if (hasKey && deleteRes) trigger(target, p, TRIGGER_TYPE.DELETE_KEY);
      return deleteRes;
    },
  });
};

export const shallowReactive = <T extends object>(data: T) => {
  return createReactive(data, { isShallow: true });
};

export const reactive = <T extends object>(data: T) => {
  return createReactive(data, { isShallow: false });
};

export const readOnly = <T extends object>(data: T) => {
  return createReactive(data, { isShallow: false, isReadOnly: true });
};
export const shallowReadOnly = <T extends object>(data: T) => {
  return createReactive(data, { isShallow: true, isReadOnly: true });
};

const getTriggerType = <T>(
  object: T extends object & { length?: number } ? T : never,
  key: string | symbol
) => {
  if (Array.isArray(object)) {
    return Number(key) < Number(object?.length)
      ? //* 数组修改某一项
        TRIGGER_TYPE.SET_KEY
      : //* 数组增加某一项
        TRIGGER_TYPE.ADD_ARRAY_LENGTH;
  }
  if (Object.prototype.hasOwnProperty.call(object, key)) {
    return TRIGGER_TYPE.SET_KEY;
  }
  return TRIGGER_TYPE.ADD_KEY;
};

const shouldTigger = (
  target: object,
  prop: string | symbol,
  value: unknown,
  receiver: any
) => {
  const oldValue = target[prop as keyof typeof target];
  if (oldValue === value) return false;
  /**
   * 结合get中的RAW使用
   * 当一个对象和它的原型都是响应式对象时
   * 设置原型上的属性会同时触发原型和对象本身上的set方法
   * 而在proxy代理的set函数中，两次set方法的receiver均指向原型的proxy，但是target不同
   * 利用这一点，可以判断当前的set是作用与对象本身还是作用于原型链上
   * 我们需要做的就是只触发作用在对象本身上的trigger方法
   */
  return target === receiver["RAW"];
};

const isObject = (data: any): data is object =>
  typeof data === "object" && data !== null;
