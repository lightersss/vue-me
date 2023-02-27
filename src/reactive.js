function wrapper(obj) {
  const proxy = new Proxy(obj, {
    get(target, key) {
      track(target, key);
      const value = Reflect.get(target, key);
      if (typeof value === "object") {
        return wrapper(value);
      }
      return value;
    },
    set(target, key, value) {
      const setRes = Reflect.set(target, key, value);
      trigger(target, key);
      return setRes;
    }
  });
  return proxy;
}

const bucket = new WeakMap();

let activeEffect;

const effect = (fn) => {
  const effectFn = () => {
    if (effectFn.depsUsedThisEffect)
      effectFn.depsUsedThisEffect.forEach((deps) => deps.delete(effectFn));
    activeEffect = effectFn;
    effectFn.depsUsedThisEffect = [];
    fn();
  };
  effectFn();
};

function track(obj, key) {
  if (!activeEffect) return;
  let mapKeyToSet = bucket.get(obj);
  if (!mapKeyToSet) bucket.set(obj, (mapKeyToSet = new Map()));
  let deps = mapKeyToSet.get(key);
  if (!deps) mapKeyToSet.set(key, (deps = new Set()));
  deps.add(activeEffect);
  activeEffect.depsUsedThisEffect.push(deps);
}

function trigger(obj, key) {
  const deps = bucket.get(obj).get(key);
  if (!deps) return;
  [...deps].forEach((fn) => {
    fn();
  });
}

export { wrapper, effect };
