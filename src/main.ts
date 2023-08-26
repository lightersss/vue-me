// import { effect, reactive, readOnly, shallowReadOnly } from "reactivity";
// const proxy = readOnly({
//   a: 0,
//   b: 1,
//   obj: {
//     c: 2,
//   },
// });

// effect(() => {
//   console.log(proxy.obj.c);
// });
// proxy.obj.c = 5;
// console.log(proxy);
import { ref, effect, reactive } from "reactivity";
const a = ref(2);
const b = reactive({
  a: 1,
  b: 2,
});
effect(() => {
  console.log({ ...b }.a);
});
b.a = 2;
