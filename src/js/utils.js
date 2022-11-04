export const createElementEx = (tag, className, root) => {
  const el = document.createElement(tag);
  if (className) {
    el.classList = Array.isArray(className) ? className.join(" ") : className;
  }

  if (root) {
    root.append(el);
  }
  return el;
};
