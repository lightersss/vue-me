import { TRACK_KEYS } from "./reactive";

let activeEffect: null | EffectFn = null;
/**
 * * 此变量与cleanUp函数结合使用
 * * 在track时，会把副作用函数收集到某个Set中（对应track函数中的effects）
 * * 此变量保存了 副作用函数 和 Set 的关系，即哪些Set中包含了这个副作用函数
 * * 在cleanUp某个副作用函数时，找到这个副作用函数对应的 Set 就可以从这个Set中删除这个副作用函数
 */
// const effectsDeps: Map<() => any, Set<() => any>[]> = new Map();
const activeEffectStack: EffectFn[] = [];

type ObjectKeyType = string | Symbol;

export enum TRIGGER_TYPE {
  ADD_KEY = "ADD_KEY",
  SET_KEY = "SET_KEY",
  DELETE_KEY = "DELETE_KEY",
  ADD_ARRAY_LENGTH = "ADD_ARRAY_LENGTH",
  // DELETE_ARRAY_LENGTH = "DELETE_ARRAY_LENGTH",
}

/**
 * @description key为原始对象,value为对象的键和effect之间的关系
 */
const dataToEffects = new WeakMap<Object, Map<ObjectKeyType, Set<EffectFn>>>();

/**
 *
 * @param data 响应式数据
 * @param key 响应式数据的key
 * @returns void
 * @description 为响应式数据增加变化时的回调
 */
export const track = (data: Object, key: ObjectKeyType) => {
  if (!activeEffect) return;
  let keyToEffects = dataToEffects.get(data);
  if (!keyToEffects) {
    dataToEffects.set(data, (keyToEffects = new Map()));
  }
  let effects = keyToEffects.get(key);
  if (!effects) {
    keyToEffects.set(key, (effects = new Set()));
  }

  effects.add(activeEffect);
  activeEffect.addDeps(effects);
  // const originEffects = effectsDeps.get(activeEffect) ?? [];
  // effectsDeps.set(activeEffect, [...originEffects, effects]);
};
/**
 *
 * @param data 响应式数据
 * @param key 响应式数据的key
 * @returns void
 * @description 触发响应式数据上的回调函数
 */
export const trigger = <T extends Object>(
  data: T,
  key: ObjectKeyType,
  type: TRIGGER_TYPE
) => {
  let keyToEffects = dataToEffects.get(data);
  if (!keyToEffects) return;
  let effects = keyToEffects.get(key);
  if (!effects) return;
  let effectsToRun = new Set(effects);
  if (type === TRIGGER_TYPE.ADD_KEY || type === TRIGGER_TYPE.DELETE_KEY) {
    const iterateKeyEffects = keyToEffects.get(TRACK_KEYS.ITERATE_KEY) ?? [];
    iterateKeyEffects.forEach((effect) => {
      effectsToRun.add(effect);
    });
  }
  if (type === TRIGGER_TYPE.ADD_ARRAY_LENGTH) {
    const lengthKeyEffects = keyToEffects.get("length") ?? [];
    lengthKeyEffects.forEach((effect) => {
      effectsToRun.add(effect);
    });
  }

  [...effectsToRun].forEach((effect) => {
    /**
     * ! 当在effect中对同一个变量进行 读取和设置时，会进行无限递归
     * ! `obj.a = obj.a + 1`
     * ! 访问obj.a时会进入track函数，为obj.a增加当前的 副作用函数
     * ! 赋值时会进入 trigger函数，触发刚刚添加的副作用函数 此时会重新执行 `obj.a = obj.a + 1` 再次触发 track和trigger
     */
    if (effect === activeEffect) return;
    effect.getScheduler()(effect.runner);
  });
};

/**
 *
 * @param effectFn 需要cleanup的副作用函数
 * @returns void
 * @description
 *
 * 为什么要cleanUp ？ 目的是根据当前的 副作用函数 的执行结果确定最新的依赖关系
 * 当副作用函数存在 `a ? b : c `时，响应式的收集只需a+b或者 a+c 。
 * 不做cleanUP的情况：
 * `a`最初为 `true`,那么在执行完毕时 a和b的变化会导致函数重新执行（符合预期）
 * `a`修改为 `false`,在执行完毕时 a和C的变化会导致函数重新执行（符合预期）
 * 但是此时修改b同样会导致函数重新执行**（不符合预期）**
 * cleanUp便是做这个用的
 * 当每次重新运行时，此轮重新运行所访问到的响应式数据会在track中重新被添加到 Set中
 */
// const cleanUpEffect = (effectFn: EffectFn) => {
//   const effectsToDelete = effectsDeps.get(effectFn);
//   if (!effectsToDelete) return;
//   effectsToDelete.forEach((effectsSet) => effectsSet.delete(effectFn));
// };

type EffectOptions = {
  scheduler?: (fn: () => any) => void;
  lazy?: boolean;
};

type EffectFnParams = {
  fn: () => any;
  lazy?: boolean;
  scheduler?: (fn: () => any) => void;
};
class EffectFn {
  public runner;
  private lazy;
  private scheduler;
  private deps: Set<EffectFn>[] = [];
  constructor(param: EffectFnParams) {
    this.lazy = param.lazy ?? false;
    this.scheduler = param.scheduler ?? ((fn) => fn());
    this.runner = () => {
      this.cleanUp();
      activeEffect = this;
      activeEffectStack.push(this);
      let res = param.fn();
      activeEffectStack.pop();
      activeEffect = activeEffectStack[activeEffectStack.length - 1];
      return res;
    };
  }

  public isLazy = () => !!this.lazy;
  public getScheduler = () => this.scheduler;
  public addDeps = (dep: Set<EffectFn>) => {
    this.deps.push(dep);
  };
  public cleanUp = () => {
    this.deps.forEach((set) => set.delete(this));
    this.deps.length == 0;
  };
}

export const effect = <T>(fn: () => T, options?: EffectOptions) => {
  /**
   * @description effect 只会执行一次，所以 effectsDeps.set 只执行一次，不会产生引用变化
   * 而 effectFn 作为响应式数据发生变化时的回调 ，会调用多次
   */
  // function effectFn() {
  //   cleanUpEffect(effectFn);
  //   activeEffect = effectFn;
  //   activeEffectStack.push(effectFn);
  //   fn();
  //   activeEffectStack.pop();
  //   activeEffect = activeEffectStack[activeEffectStack.length - 1];
  // }
  // effectsDeps.set(effectFn, []);
  const effectFn = new EffectFn({
    fn,
    ...options,
  });
  // if (options?.scheduler) {
  //   //todo:为什么书里要放在trigger函数里执行 ？ vue源码也是这么做的
  //   options.scheduler(effectFn.runner);
  //   return;
  // }
  if (options?.lazy) {
    return effectFn;
  }
  effectFn.runner();
};
