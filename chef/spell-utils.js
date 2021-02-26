export const spellMetaKeyTranslates = {
  学派: 'school',
  环位: 'level',
  等级: 'level',
  领域: 'domain',
  施法时间: 'castingTime',
  成分: 'components',
  距离: 'range',
  效果: 'effect',
  目标: 'target',
  区域: 'area',
  范围: 'area',
  目标或区域: 'aiming',
  目标或效果: 'aiming',
  '目标, 区域或效果': 'aiming',
  '目标, 效果或区域': 'aiming',
  持续时间: 'duration',
  豁免: 'saving',
  法术抗力: 'resistance',
};

export const metaKeyRegex = new RegExp(
  `^(${Object.keys(spellMetaKeyTranslates).join('|')})(：|\\s)`
);

export function startsWithMetaKey(text) {
  return metaKeyRegex.test(text);
}

export function spellMetaFromTexts(texts) {
  const meta = {};

  let lastKey = '';
  texts.forEach((t) => {
    const splitted = t.includes('：') ? t.split('：') : t.split(' ');
    let key = spellMetaKeyTranslates[splitted[0]];
    let moreText = splitted.slice(1).join(' ');
    if (t.startsWith('目标, 区域或效果') || t.startsWith('目标, 效果或区域')) {
      key = 'aiming';
      moreText = splitted.slice(2).join(' ');
    }

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
