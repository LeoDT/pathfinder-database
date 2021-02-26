export const featMetaKeyTranslates = {
  先决条件: 'requirement',
  专长效果: 'benefit',
  通常状况: 'normal',
  特殊说明: 'special',
};

export const metaKeyRegex = new RegExp(`^(${Object.keys(featMetaKeyTranslates).join('|')})：`);

export function startsWithMetaKey(text) {
  return metaKeyRegex.test(text);
}

export function featMetaFromTexts(texts) {
  const meta = {};

  let lastKey = '';
  texts.forEach((t) => {
    const splitted = t.split('：');
    let key = featMetaKeyTranslates[splitted[0]];
    let moreText = splitted.slice(1).join(' ');

    if (key) {
      if (meta[key]) {
        // very rare case
        meta[key] += moreText;
      } else {
        meta[key] = moreText;
      }

      lastKey = key;
    } else {
      meta[lastKey] += t;
    }
  });

  return meta;
}
