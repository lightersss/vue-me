export default function normalizeClassNames(
  classNames:
    | string
    | Record<string, boolean>
    | (string | Record<string, boolean>)[]
) {
  if (typeof classNames === "string") return classNames;
  if (Array.isArray(classNames)) {
    return classNames
      .map((className) => normalizeClassNames(className))
      .join(" ");
  }
  return Object.entries(classNames)
    .filter(([, used]) => used)
    .map(([className]) => className)
    .join(" ");
}

console.log(normalizeClassNames("a b v"));
