let activeEffect: null | (() => any) = null;

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
};

export const trigger = (data: Object, key: ObjectKeyType) => {
  let keyToEffects = dataToEffects.get(data);
  if (!keyToEffects) return;
  let effects = keyToEffects.get(key);
  if (!effects) return;
  effects.forEach((effect) => effect());
};

export const effect = <T>(fn: () => T) => {
  activeEffect = fn;
  fn();
};
