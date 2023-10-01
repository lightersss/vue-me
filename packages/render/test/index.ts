import { render } from "render";
import { ref, effect, reactive } from "reactivity";

const flag = ref({
  a: 1,
});

effect(() => {
  render(
    {
      type: "div",
      children: [
        {
          type: "div",
          children: "asd1",
          props: {
            class: "a b c",
          },
        },
        {
          type: "div",
          children: flag.value.a + "",
          props: {
            class: {
              a: true,
              b: false,
            },
            onclick() {
              flag.value.a++;
            },
          },
        },
      ],
    },
    document.getElementById("app")!
  );
  console.log(flag.value.a);
});
