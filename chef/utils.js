export function range(n) {
  const r = [];

  for (let i = 0; i < n; i++) {
    r.push(i);
  }

  return r;
}

export function pick(obj, keys) {
  const newObj = {};

  Object.keys(obj).forEach((k) => {
    if (keys.includes(k)) {
      newObj[k] = obj[k];
    }
  });

  return newObj;
}

export function removeNewlines(text) {
  return text.replace(/(\r\n|\n|\r)/g, '').trim();
}

export function removeSpaces(text) {
  return text.replace(/\s+/g, ' ').trim();
}

export function compose(...fns) {
  const compose2 =
    (f, g) =>
    (...args) =>
      f(g(...args));

  return fns.reduce(compose2);
}

export function parseWeight(weight) {
  const s = weight.replace(/lbs?\./, '');

  if (s.includes('/')) {
    const [t, b] = s.split('/');
    const w = t / b;

    if (Number.isNaN(w)) {
      return 0;
    }

    return w;
  }

  if (/\d+/.test(s)) {
    return parseInt(s);
  }

  return 0;
}

export const nameAndIdAndTypeRegex =
  /^(?<name>.{1,10}?)\s?[（(](?<id>.+?)?[,，]?\s?(?<type>sp|Sp|SP|Su|su|SU|Ex|ex|EX)?[)）]$/;
export function extractNameAndIdAndType(s) {
  return s.match(nameAndIdAndTypeRegex).groups;
}
