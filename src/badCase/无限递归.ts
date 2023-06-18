import { reactive, effect } from "reactivity";

const proxy = reactive({ a: 0, b: 1, isTrue: true });

effect(() => {
  //! 无限递归
  //! 这里track了，此时这个函数已经被加到了依赖中
  const temp = proxy.a + 1;
  //!这里执行了
  console.log(temp);
  //! 到这里触发trigger，从头执行
  proxy.a = temp;
  //! 执行不到这里
  console.log("永远执行不到这里");
});
proxy.a = 1;
