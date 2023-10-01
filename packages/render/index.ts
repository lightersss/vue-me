const specialVNodeType = {
  TEXT: Symbol.for("__TEXT__"),
  COMMENT: Symbol.for("COMMENT"),
  FRAGEMENT: Symbol.for("FRAGEMENT"),
};

type vNode<T> = {
  type: string;
  children: vNode<T>[] | string | null;
  props?: Record<string, unknown>;
  el?: T | null;
};

type textVNode<Text> = {
  type: symbol;
  children: string;
  el?: Text;
};

type commentVNode<Comment> = {
  type: symbol;
  children: string;
  el?: Comment;
};

// type TextVNode<T> = {
//   type: symbol;
//   children: vNode<T>[] | string | null;
// };

type container<T> = { _vnode?: vNode<T> | null };

type createRenderOptions<T, TextNode, CommentNode> = {
  createElement: (vNode: vNode<T>) => T;
  setElementText: (element: T, text: string) => void;
  insert: (element: T | CommentNode | TextNode, container: T) => void;
  patchProps: (element: T, prop: string, oldValue: any, newValue: any) => void;
  removeElement: (vNode: vNode<T>) => void;

  createTextNode: (text: string) => TextNode;
  setTextNodeContent: (element: TextNode, text: string) => void;

  createCommentNode: (text: string) => CommentNode;
  setCommentNodeContent: (element: CommentNode, text: string) => void;
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
  function isTextVNode(
    node: textVNode<Text> | vNode<T> | commentVNode<Comment>
  ): node is textVNode<Text> {
    return node.type === specialVNodeType.TEXT;
  }

  function isCommentVNode(
    node: textVNode<Text> | vNode<T> | commentVNode<Comment>
  ): node is commentVNode<any> {
    return node.type === specialVNodeType.COMMENT;
  }

  function mountElement(
    vNode: vNode<T> | textVNode<Text> | commentVNode<Comment>,
    container: T
  ) {
    if (isTextVNode(vNode)) {
      const el = createTextNode(vNode.children);
      setTextNodeContent(el, vNode.children);
      insert(el, container);
      vNode.el = el;
      return;
    } else if (isCommentVNode(vNode)) {
      const el = createCommentNode(vNode.children);
      setCommentNodeContent(el, vNode.children);
      insert(el, container);
      78;
      vNode.el = el;
      return;
    }

    let el: T | Text | null = null;

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
  function patchChildren(newVNode: vNode<T>, oldVNode: vNode<T>, el: T) {
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
    newVNode: vNode<T> | textVNode<Text>,
    oldVNode: vNode<T>
  ) {
    if (isTextVNode(newVNode)) {
      const el = newVNode.el;
      el && setTextNodeContent(el, newVNode.children);
      return;
    }

    if (isCommentVNode(newVNode)) {
      const el = newVNode.el;
      el && setCommentNodeContent(el, newVNode.children);
      return;
    }
    const el = (newVNode.el = oldVNode.el);
    if (!el) return;
    const newProps = newVNode.props;
    const oldProps = oldVNode.props;
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
  function _patch(newVNode: vNode<T>, oldVNode: vNode<T> | null, container: T) {
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
    //!更新
    if (typeof newVNode.type === "string") {
      patchElement(newVNode, oldVNode);
    }
  }

  function unmountElement(vNode: vNode<T>) {
    removeElement(vNode);
  }

  function render(vNode: vNode<T> | null, container: T & container<T>) {
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
