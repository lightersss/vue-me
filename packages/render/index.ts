export const specialVNodeType = {
  TEXT: Symbol.for("__TEXT__"),
  COMMENT: Symbol.for("COMMENT"),
  FRAGMENT: Symbol.for("FRAGMENT"),
};

type vNode<T, Text, Comment> =
  | {
      type: keyof HTMLElementTagNameMap;
      children: vNode<T, Text, Comment>[] | string | null;
      props?: Record<string, unknown>;
      el?: T | null;
    }
  | textVNode<Text>
  | commentVNode<Comment>
  | fragmentVNode<T, Text, Comment>;

type textVNode<T> = {
  type: "TEXT";
  children: string;
  el?: T;
};

type commentVNode<C> = {
  type: "COMMENT";
  children: string;
  el?: C;
};

type fragmentVNode<T, Text, Comment> = {
  type: "FRAGMENT";
  children: vNode<T, Text, Comment>[];
};

// type TextVNode<T,Text,Comment> = {
//   type: symbol;
//   children: vNode<T,Text,Comment>[] | string | null;
// };

type container<T, Text, Comment> = { _vnode?: vNode<T, Text, Comment> | null };

type createRenderOptions<T, Text, Comment> = {
  createElement: (vNode: vNode<T, Text, Comment>) => T;
  setElementText: (element: T, text: string) => void;
  insert: (element: T | Comment | Text, container: T) => void;
  patchProps: (element: T, prop: string, oldValue: any, newValue: any) => void;
  removeElement: (
    vNode: vNode<T, Text, Comment> | fragmentVNode<T, Text, Comment>
  ) => void;

  createTextNode: (text: string) => Text;
  setTextNodeContent: (element: Text, text: string) => void;

  createCommentNode: (text: string) => Comment;
  setCommentNodeContent: (element: Comment, text: string) => void;
};

export function createRender<T, Text, Comment>(
  options: createRenderOptions<T, Text, Comment>
) {
  const {
    createElement,
    setElementText,
    insert,
    patchProps,
    removeElement,
    createCommentNode,
    createTextNode,
    setTextNodeContent,
    setCommentNodeContent,
  } = options;

  // function isTextVNode(
  //   node:
  //     | textVNode<Text>
  //     | vNode<T, Text, Comment>
  //     | commentVNode<Comment>
  //     | fragmentVNode<T, Text, Comment>
  // ): node is textVNode<Text> {
  //   return node.type === specialVNodeType.TEXT;
  // }

  // function isCommentVNode(
  //   node:
  //     | textVNode<Text>
  //     | vNode<T, Text, Comment>
  //     | commentVNode<Comment>
  //     | fragmentVNode<T, Text, Comment>
  // ): node is commentVNode<Comment> {
  //   return node.type === specialVNodeType.COMMENT;
  // }

  // function isFragmentVNode(
  //   node:
  //     | textVNode<Text>
  //     | vNode<T, Text, Comment>
  //     | commentVNode<Comment>
  //     | fragmentVNode<T, Text, Comment>
  // ): node is fragmentVNode<T, Text, Comment> {
  //   return node.type === specialVNodeType.FRAGMENT;
  // }

  function mountElement(vNode: vNode<T, Text, Comment>, container: T) {
    if (vNode.type === "TEXT") {
      const el = createTextNode(vNode.children);
      setTextNodeContent(el, vNode.children);
      insert(el, container);
      vNode.el = el;
      return;
    } else if (vNode.type === "COMMENT") {
      const el = createCommentNode(vNode.children);
      setCommentNodeContent(el, vNode.children);
      insert(el, container);
      vNode.el = el;
      return;
    } else if (vNode.type === "FRAGMENT") {
      vNode.children.forEach((c) => _patch(c, null, container));
      return;
    }

    let el: T | null = null;

    el = createElement(vNode);
    vNode.el = el;

    if (typeof vNode.children === "string") {
      setElementText(el, vNode.children);
    } else if (Array.isArray(vNode.children)) {
      for (const child of vNode.children) {
        // mountElement(child, el);
        _patch(child, null, el);
      }
    }

    //* 处理属性
    for (const prop in vNode.props) {
      patchProps(el, prop, null, vNode.props[prop]);
    }

    if (el) insert(el, container);
  }
  /**
   * @description 当新旧元素类型相同时调用此函数 更新节点的children属性
   * @param newVNode
   * @param oldVNode
   * @returns
   */
  function patchChildren(
    newVNode: vNode<T, Text, Comment>,
    oldVNode: vNode<T, Text, Comment>,
    el: T
  ) {
    if (typeof newVNode.children === "string") {
      if (Array.isArray(oldVNode.children)) {
        oldVNode.children.forEach((c) => unmountElement(c));
      }

      setElementText(el, newVNode.children);
    }

    if (Array.isArray(newVNode.children)) {
      if (Array.isArray(oldVNode.children)) {
        //TODO: DIFF
        oldVNode.children.forEach((c) => unmountElement(c));
        newVNode.children.forEach((c) => _patch(c, null, el));
      } else {
        setElementText(el, "");
        newVNode.children.forEach((c) => _patch(c, null, el));
      }
    }

    if (!newVNode.children) {
      if (Array.isArray(oldVNode.children)) {
        oldVNode.children.forEach((c) => unmountElement(c));
      } else {
        setElementText(el, "");
      }
    }
  }

  /**
   * @description 当新旧元素类型相同时调用此函数 更新节点的属性（包含children）
   * @param newVNode
   * @param oldVNode
   * @returns
   */
  function patchElement(
    newVNode: vNode<T, Text, Comment>,
    oldVNode: vNode<T, Text, Comment>,
    container: T
  ) {
    //特殊节点
    if (newVNode.type === "TEXT") {
      const el = newVNode.el;
      el && setTextNodeContent(el, newVNode.children);
      return;
    } else if (newVNode.type === "COMMENT") {
      const el = newVNode.el;
      el && setCommentNodeContent(el, newVNode.children);
      return;
    } else if (newVNode.type === "FRAGMENT") {
      patchChildren(newVNode, oldVNode, container);
      return;
    }

    if (newVNode.type !== oldVNode.type) return;

    const el = (newVNode.el = oldVNode.el);
    if (!el) return;
    const newProps = newVNode.props;
    const oldProps = oldVNode?.props ?? {};
    for (const prop in newProps) {
      if (newProps[prop] !== oldProps?.[prop]) {
        patchProps(el, prop, oldProps?.[prop], newProps[prop]);
      }
    }

    for (const prop in oldProps) {
      if (!(prop in (newProps ?? {}))) {
        patchProps(el, prop, oldProps?.[prop], null);
      }
    }

    patchChildren(newVNode, oldVNode, el);
  }
  /**
   * @description 增加或更新节点时使用
   * @param newVNode
   * @param oldVNode
   * @param container
   * @returns
   */
  function _patch(
    newVNode: vNode<T, Text, Comment>,
    oldVNode: vNode<T, Text, Comment> | null,
    container: T
  ) {
    //! 第一次渲染
    if (!oldVNode) {
      mountElement(newVNode, container);
      return;
    }
    //! 元素类型不一致卸载旧元素 创建新元素
    if (newVNode.type !== oldVNode.type) {
      unmountElement(oldVNode);
      mountElement(newVNode, container);
    }
    //!元素类型一致 更新
    if (typeof newVNode.type === "string") {
      patchElement(newVNode, oldVNode, container);
    }
  }

  function unmountElement(
    vNode: vNode<T, Text, Comment> | fragmentVNode<T, Text, Comment>
  ) {
    removeElement(vNode);
  }

  function render(
    vNode: vNode<T, Text, Comment> | null,
    container: T & container<T, Text, Comment>
  ) {
    //! 第一次渲染或者更新
    if (vNode) {
      _patch(vNode, container._vnode ?? null, container);
    } else {
      //!卸载
      if (container._vnode) {
        unmountElement(container._vnode);
      }
    }
    container._vnode = vNode;
  }
  return {
    render,
  };
}
