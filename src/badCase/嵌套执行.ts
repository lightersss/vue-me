import { reactive, effect } from "reactivity";

const proxy = reactive({ a: 0, b: 1 });

/**
 * 外层的副作用函数只访问a
 * 内层的副作用函数只访问b
 * 预期：a修改 ，内外侧都执行
 *       b修改，只执行内层
 * 实际：a修改 ，只执行内层
 *      b修改，只执行内层
 * 原因：执行内层 副作用函数 时,activeEffect为内层函数，执行完毕时，仍然为内层
 *      导致收集proxy.a的 副作用函数 时错误的把内层的副作用函数收集进了回调中
 */

effect(() => {
  console.log("外层");

  effect(() => {
    console.log("内层");
    console.log(proxy.b);
  });
  console.log(proxy.a);
});
proxy.a = 1;
