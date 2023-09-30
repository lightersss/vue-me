type vNode = {
  type: string;
  children: vNode[] | string;
  props: Record<string, unknown>;
};
type container = { _vnode: vNode | null };

type createRenderOptions<T> = {
  createElement: (vNode: vNode) => T;
  setElementText: (element: T, text: string) => void;
  insert: (element: T, container: T) => void;
  patchProps(element: T, props: Record<string, unknown>);
};

export function createRender<T>(options: createRenderOptions<T>) {
  const { createElement, setElementText, insert, patchProps } = options;

  function mountElement(vNode: vNode, container: T) {
    let el: T | null = null;
    el = createElement(vNode);

    if (typeof vNode.children === "string") {
      setElementText(el, vNode.children);
    } else if (Array.isArray(vNode.children)) {
      for (const child of vNode.children) {
        // mountElement(child, el);
        _patch(child, null, el);
      }
    }

    patchProps(el, vNode.props ?? {});

    if (el) insert(el, container);
  }

  function _patch(newVNode: vNode, oldVNode: vNode | null, container: T) {
    //! 第一次渲染
    if (!oldVNode) {
      mountElement(newVNode, container);
    }
  }

  function render(vNode: vNode | null, container: T & container) {
    //! 第一次渲染或者更新
    if (vNode) {
      _patch(vNode, container._vnode, container);
    } else {
      //!卸载
      if (container._vnode) {
        setElementText(container, "");
      }
    }
    container._vnode = vNode;
  }
  return {
    render,
  };
}

export const { render } = createRender<HTMLElement>({
  createElement(vNode) {
    const el = document.createElement(vNode.type);
    return el;
  },
  setElementText(el, text) {
    el.textContent = text;
  },
  insert: function (el, container) {
    container.appendChild(el);
  },
  patchProps: function (el, props) {
    //判断是否应该把属性设置在DomAttribute上
    function shouldPatchSinglePropOnDomAttribute(
      el: HTMLElement,
      attr: string,
      value?: unknown
    ) {
      //input标签上的form属性在DOM属性上是只读的，因此只能设置在HTML属性上
      if (attr === "form" && el.tagName.toUpperCase() === "INPUT") return false;
      return attr in el;
    }

    /**
     * *属性分为HTML属性和DOM属性
     * *HTML属性体现在直接写在HTML标签上
     * *dom属性体现在element对象的属性上
     * *两者并不一一对应
     */
    Object.entries(props).forEach(([attr, value]) => {
      //!设置的属性在DOM属性上存在
      if (shouldPatchSinglePropOnDomAttribute(el, attr, value)) {
        const typeOfAttr = typeof value;
        if (typeOfAttr === "boolean" && value === "") {
          el[attr] = true;
          return;
        }
        el[attr] = value;
        return;
      }
      //!设置的属性在DOM属性上并不存在 设置为HTML属性
      el.setAttribute(attr, String(value));
    });
  },
});
