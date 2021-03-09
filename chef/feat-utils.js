export const featMetaKeyTranslates = {
  先决条件: 'requirement',
  专长效果: 'benefit',
  通常状况: 'normal',
  特殊说明: 'special',
};

export const featTypeTranslates = {
  战斗: 'combat',
  超魔: 'metamagic',
  造物: 'item creation',
  重击: 'critical',
  团队: 'teamwork',
  勇毅: 'grit',
  演武: 'performance',
  流派: 'style',
  派头: 'panache',
  技巧: 'technique',
  注视: 'stare',
  奥术发现: 'arcane discovery',
  故事: 'story',
};

export const metaKeyRegex = new RegExp(`^(${Object.keys(featMetaKeyTranslates).join('|')})：`);

export function startsWithMetaKey(text) {
  return metaKeyRegex.test(text);
}

export function featTypeFromText(text) {
  if (typeof text !== 'string') console.log(text);
  const texts = text.replace(/专长/g, '').split('，');

  return texts.map((t) => {
    const type = featTypeTranslates[t];

    if (type) {
      return type;
    }

    throw Error(`no translate found for feat type ${t}`);
  });
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
