import { wrapper, effect } from "./src/reactive";
const obj = wrapper({ a: 1, b: 2, c: true });

effect(() => {
  console.log(`${obj.c ? obj.a + obj.b : "c"}`);
  // console.log(obj.a);
});

obj.c = false;
obj.a = 3;
obj.a = 3;
obj.a = 3;
obj.a = 3;
obj.c = true;
obj.b = 3;
