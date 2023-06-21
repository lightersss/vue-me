const effectTaskQueue: Set<() => any> = new Set();
export function enQueueEffectFn(effectFn: () => any): void {
  effectTaskQueue.add(effectFn);
}

let isFlushing = false;

const ResolvedPromise = Promise.resolve(null);

export function flushQueue(): void {
  if (isFlushing) return;
  isFlushing = true;
  ResolvedPromise.then(() => {
    effectTaskQueue.forEach((fn) => fn());
  }).finally(() => {
    isFlushing = false;
  });
}
