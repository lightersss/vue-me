import { createRender } from "render";
import normalizeClassNames from "./utils/normalizeCSS";
export const { render } = createRender<Element, Text, Comment>({
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
  patchProps: function (el, prop, oldValue, value) {
    //判断是否应该把属性设置在DomAttribute上
    function shouldPatchSinglePropOnDomAttribute(
      el: Element,
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
    if (/^on/.test(prop)) {
      handleEvent(el, prop, value);
    }
    if (prop === "class") {
      el.className = normalizeClassNames(value);
      return;
    }

    if (shouldPatchSinglePropOnDomAttribute(el, prop, value)) {
      const typeOfAttr = typeof value;
      if (typeOfAttr === "boolean" && value === "") {
        (el as any)[prop] = true as any;
        return;
      }
      (el as any)[prop] = value;
      return;
    }
    //!设置的属性在DOM属性上并不存在 设置为HTML属性
    el.setAttribute(prop, String(value));
  },
  removeElement(vNode) {
    vNode.el?.parentNode?.removeChild(vNode?.el);
  },
  createTextNode: function (text: string) {
    return document.createTextNode(text);
  },
  createCommentNode: function (text: string) {
    return document.createComment(text);
  },
  setTextNodeContent: function (element, text: string): void {
    element.nodeValue = text;
  },
  setCommentNodeContent: function (element, text: string): void {
    element.nodeValue = text;
  },
});

interface EventHandlerWrapper extends EventListener {
  value: Function;
  attachedTimestamp: number;
}

function handleEvent(
  el: Element & {
    _eventMap?: Record<string, EventHandlerWrapper | undefined>;
  },
  attr: string,
  handler: unknown
) {
  const isLegalHandler = typeof handler === "function";
  const eventName = attr.slice(0, 2).toLowerCase();
  const eventMap = el._eventMap ?? (el._eventMap = {});
  const wrapperedEventHandler = eventMap[eventName];

  //* 新绑定的事件
  if (!wrapperedEventHandler && isLegalHandler) {
    const _eventHandler: EventHandlerWrapper = (e) => {
      if (e.timeStamp < _eventHandler.attachedTimestamp) return;
      _eventHandler.value(e);
    };
    _eventHandler.value = handler;
    _eventHandler.attachedTimestamp = performance.now();

    eventMap[eventName] = _eventHandler;
    el.addEventListener(eventName, _eventHandler);
  } else if (!handler && wrapperedEventHandler) {
    //* 之前按已经绑定了事件，但这次传了空
    el.removeEventListener(eventName, wrapperedEventHandler);
  } else if (isLegalHandler && wrapperedEventHandler) {
    wrapperedEventHandler.value = handler;
  }
}
