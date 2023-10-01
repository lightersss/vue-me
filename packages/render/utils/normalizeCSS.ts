export default function normalizeClassNames(classNames: any): string {
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
