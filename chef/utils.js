export function range(n) {
  const r = [];

  for (let i = 0; i < n; i++) {
    r.push(i);
  }

  return r;
}

export function removeNewlines(text) {
  return text.replace(/(\r\n|\n|\r)/g, '').trim();
}

export function removeSpaces(text) {
  return text.replace(/\s+/g, ' ').trim();
}
