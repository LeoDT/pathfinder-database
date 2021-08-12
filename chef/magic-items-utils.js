import { parse } from 'https://deno.land/std@0.104.0/encoding/csv.ts';

export async function initMagicItemsIndex() {
  const f = await Deno.readTextFile('./chef/data/magic_items_full - Updated 19Jan2020.csv');
  const rows = await parse(f, { skipFirstRow: true });

  const index = new Map();
  const indexWithVariant = new Map();
  rows.forEach((r) => {
    const key = r.Name.toLowerCase();

    index.set(key, r);

    let k = '';
    if (key.includes('+')) {
      k = key.replace(/\s\+\d$/, '');
    }

    if (
      key.startsWith('vambraces of the genie') ||
      key.startsWith('ring of energy resistance') ||
      key.startsWith('ring of inner fortitude') ||
      key.startsWith('ring of revelation') ||
      key.startsWith('dungeon ring')
    ) {
      k = key.replace(/,\s.+$/, '');
    }

    if (key.startsWith('ring of spell knowledge')) {
      k = key.replace(/\stype\s.*$/, '');
    }

    if (key.startsWith('ring of wizardry')) {
      k = key.replace(/wizardry\s.*$/, 'wizardry');
    }

    const v = [...(indexWithVariant.get(k) ?? []), r];

    indexWithVariant.set(k, v);
  });

  return [index, indexWithVariant];
}

export function variantName(id, name) {
  id = id.toLowerCase();

  if (id.includes('+')) {
    const prefix = id.replace(/.*\s(\+\d)$/, '$1');

    return `${prefix} ${name}`;
  }

  if (id.startsWith('ring of spell knowledge') || id.startsWith('ring of wizardry')) {
    const type = id.split(' ').slice(-1)[0];
    let suffix = '';
    switch (type) {
      case 'i':
        suffix = '一';
        break;
      case 'ii':
        suffix = '二';
        break;
      case 'iii':
        suffix = '三';
        break;
      case 'iv':
        suffix = '四';
        break;
    }
    return `${name}${suffix}型`;
  }

  if (
    id.startsWith('vambraces of the genie') ||
    id.startsWith('ring of energy resistance') ||
    id.startsWith('ring of inner fortitude') ||
    id.startsWith('ring of revelation') ||
    id.startsWith('dungeon ring')
  ) {
    const type = id.split(', ')[1];

    let suffix = '';
    let prefix = '';
    switch (type) {
      case "jailer's":
        prefix = '囚犯';
        break;
      case "prinsoner's":
        prefix = '狱卒';
        break;
      case 'lesser':
        prefix = '次等';
        break;
      case 'minor':
        prefix = '低等';
        break;
      case 'major':
        prefix = '中等';
        break;
      case 'greater':
        prefix = '高等';
        break;
      case 'superior':
        prefix = '超等';
        break;
      case 'djinni':
        prefix = '风';
        break;
      case 'efreeti':
        prefix = '火';
        break;
      case 'marid':
        prefix = '水';
        break;
      case 'shaitan':
        prefix = '土';
        break;
    }

    return `${prefix}${name}${suffix}`;
  }

  return name;
}
