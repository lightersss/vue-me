let activeEffect: null | (() => any) = null;
/**
 * * 此变量与cleanUp函数结合使用
 * * 在track时，会把副作用函数收集到某个Set中（对应track函数中的effects）
 * * 此变量保存了 副作用函数 和 Set 的关系，即哪些Set中包含了这个副作用函数
 * * 在cleanUp某个副作用函数时，找到这个副作用函数对应的 Set 就可以从这个Set中删除这个副作用函数
 */
const effectsDeps: Map<() => any, Set<() => any>[]> = new Map();

type ObjectKeyType = string | Symbol | number;

/**
 * @description key为原始对象,value为对象的键和effect之间的关系
 */
const dataToEffects = new WeakMap<Object, Map<ObjectKeyType, Set<() => any>>>();

export const track = (data: Object, key: string | Symbol | number) => {
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

  const originEffects = effectsDeps.get(activeEffect) ?? [];
  effectsDeps.set(activeEffect, [...originEffects, effects]);
};

export const trigger = (data: Object, key: ObjectKeyType) => {
  let keyToEffects = dataToEffects.get(data);
  if (!keyToEffects) return;
  let effects = keyToEffects.get(key);
  if (!effects) return;
  [...effects].forEach((effect) => effect());
};
/**
 *
 * @param effectFn 需要cleanup的副作用函数
 * @returns void
 * @description
 * 为什么要cleanUp ？ 目的是根据当前的 副作用函数 的执行结果确定最新的依赖关系
 * 当副作用函数存在 `a ? b : c `时，响应式的收集只需a+b或者 a+c 。
 * 不做cleanUP的情况：
 * `a`最初为 `true`,那么在执行完毕时 a和b的变化会导致函数重新执行（符合预期）
 * `a`修改为 `false`,在执行完毕时 a和C的变化会导致函数重新执行（符合预期）
 * 但是此时修改b同样会导致函数重新执行**（不符合预期）**
 * cleanUp便是做这个用的
 * 当每次重新运行时，此轮重新运行所访问到的响应式数据会在track中重新被添加到 Set中
 */
const cleanUpEffect = (effectFn: () => any) => {
  const effectsToDelete = effectsDeps.get(effectFn);
  if (!effectsToDelete) return;
  effectsToDelete.forEach((effectsSet) => effectsSet.delete(effectFn));
};

export const effect = <T>(fn: () => T) => {
  /**
   * @description effect 只会执行一次，所以 effectsDeps.set 只执行一次，不会产生引用变化
   * 而 effectFn 作为响应式数据发生变化时的回调 ，会调用多次
   */
  function effectFn() {
    cleanUpEffect(effectFn);
    activeEffect = effectFn;
    fn();
  }
  effectsDeps.set(effectFn, []);
  effectFn();
};
