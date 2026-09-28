/** JSX display localization. Uses React rendering, never rewrites DOM or stored data. */
import React, { useContext } from 'react';
import { jsx as reactJsx, jsxs as reactJsxs } from 'react/jsx-runtime';
import { useLocale, TranslationScope } from './locale.jsx';
import { translate, translateTreeText } from './localization.mjs';
export const Fragment = React.Fragment;
const attributes = ['title', 'placeholder', 'alt', 'aria-label', 'aria-description', 'aria-valuetext', 'label'];
const hasText = value => typeof value === 'string' || Array.isArray(value) && value.some(hasText);
function LocalizedFragment({ children, staticChildren }) {
  const { locale } = useLocale();
  const allowed = useContext(TranslationScope);
  return (staticChildren ? reactJsxs : reactJsx)(React.Fragment, { children: allowed ? translateTreeText(children, locale) : children });
}

function LocalizedElement({ tag, attributes: original, staticChildren }) {
  const { locale } = useLocale();
  const allowed = useContext(TranslationScope);
  const render = staticChildren ? reactJsxs : reactJsx;
  if (!allowed || original.translate === 'no' || ['script', 'style', 'code', 'pre'].includes(tag)) {
    const element = render(tag, original);
    return original.translate === 'no' ? React.createElement(TranslationScope.Provider, { value: false }, element) : element;
  }
  const props = { ...original, children: translateTreeText(original.children, locale) };
  for (const key of attributes) if (typeof original[key] === 'string') props[key] = translate(original[key], locale);
  if (tag === 'input' && ['submit', 'button', 'reset'].includes(props.type)) props.value = translate(original.value, locale);
  return render(tag, props);
}
function localizedJsx(type, props, key, staticChildren = false) {
  if (type === React.Fragment) return reactJsx(LocalizedFragment, { ...props, staticChildren }, key);
  const localize = typeof type === 'string' && props && (props.translate === 'no' || hasText(props.children) || attributes.some(name => Object.hasOwn(props, name)));
  return localize
    ? reactJsx(LocalizedElement, { tag: type, attributes: props, staticChildren }, key)
    : (staticChildren ? reactJsxs : reactJsx)(type, props, key);
}
export const jsx = (type, props, key) => localizedJsx(type, props, key, false);
export const jsxs = (type, props, key) => localizedJsx(type, props, key, true);
export const jsxDEV = localizedJsx;
