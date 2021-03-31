import { parse as parseCSV } from 'https://deno.land/std@0.85.0/encoding/csv.ts';
import { parse as parseYAML, stringify } from 'https://deno.land/std@0.85.0/encoding/yaml.ts';

const IDS = {
  'spiked shield, light': 'spiked light shield',
  'sword, short': 'shortsword',
  'spiked shield, heavy': 'spiked heavy shield',
  'hammer, gnome hooked': 'gnome hooked hammer',
  'axe, orc double': 'orc double axe',
  'crossbow, repeating heavy': 'repeating heavy crossbow',
  'crossbow, repeating light': 'repeating light crossbow',
  'sling staff, halfling': 'halfling sling staff',
};
const longbowRegex = /Longbow,\scomposite\s\(\+[12345]\)/;

export function pickWeapon(obj, keys) {
  const newObj = {};

  Object.keys(obj).forEach((k) => {
    if (keys.includes(k)) {
      const v = obj[k];

      if (v === '—' || !v || v === 'see text') {
        return;
      }

      newObj[k] = obj[k];
    }
  });

  return newObj;
}

function extractAmount(name) {
  const match = name.match(/\((\+?\d{1,2})\)/)?.[1];

  if (match) {
    if (match.startsWith('+')) {
      return match;
    }

    if (match === '1') {
      return '';
    }

    return match;
  }

  return '';
}

const dataFile = await Deno.readTextFile('./chef/data/weapons.csv');
const descFile = (
  await Promise.all(
    [
      './chef/data/weapons/simple.yaml',
      './chef/data/weapons/martial.yaml',
      './chef/data/weapons/exotic.yaml',
      './chef/data/weapons/aa2.yaml',
    ].map((f) => Deno.readTextFile(f))
  )
).join('\n');

const data = await parseCSV(dataFile, {
  columns: [
    'name',
    'cost',
    'damageSmall',
    'damage',
    'critical',
    'range',
    'weight',
    'damageType',
    'special',
    'source',
  ],
});
const descriptions = {};

(await parseYAML(descFile)).forEach((d) => {
  descriptions[d.id.toLowerCase()] = d;
});

const weapons = [];
const pickFields = ['cost', 'damage', 'damageType', 'critical', 'range', 'weight', 'special'];

let training = null;
let category = null;
for (const c of data) {
  if (c.name.startsWith('(')) {
    const match = c.name.replace(/\n/g, '').match(/^\((?<category>.*?)\)(?<type>.*?)$/).groups;

    if (match.category && match.type) {
      training = match.category.toLowerCase().trim();
      category = match.type.replace('Weapons', '').replace('Melee', '').toLowerCase().trim();
    }

    continue;
  }

  if (longbowRegex.test(c.name)) {
    continue;
  }

  if (category === 'ammunition') {
    continue;
  }

  const meta = pickWeapon(c, pickFields);

  if (meta.range) {
    meta.range = parseInt(meta.range.replace('ft.', '').trim());
  }
  if (meta.weight) {
    meta.weight = parseInt(meta.weight.replace(/lbs?\./, '').trim());
  }
  if (meta.special) {
    const special = meta.special.toLowerCase().replace('strength (-)', '').trim();
    if (special) {
      meta.special = special.split(', ');
    } else {
      delete meta.special;
    }
  }
  if (meta.damageType === 'P & S') {
    meta.damageType = 'P and S';
  }
  if (meta.damageType === 'B (or S)') {
    meta.damageType = 'B or S';
  }

  c.name = c.name.replace('composite (+0)', 'composite');
  const id = c.name.toLowerCase();
  let d = descriptions[id];

  if (!d) {
    const id2 = id.replace(/[()]/g, '').replace(', ', ' ').split(' ').reverse().join(' ');
    d = descriptions[id2];
  }

  if (!d) {
    const id3 = IDS[id];
    d = descriptions[id3];
  }

  let name = '';
  let desc = '';

  if (d && d.name && d.desc) {
    const amount = extractAmount(c.name);
    name = `${d.name}${amount ? ` (${amount})` : ''}`;
    desc = d.desc;
  }

  const weapon = {
    id: c.name,
    name,
    desc,
    meta: {
      training,
      category,
      ...meta,
    },
  };

  weapons.push(weapon);
}

Deno.writeTextFile(`pf-database/weapon-types.yaml`, stringify(weapons, { lineWidth: -1 }));

const set = new Set();
weapons.forEach((w) => {
  w.meta.special?.forEach((s) => {
    set.add(s);
  });
});

console.log(set);
