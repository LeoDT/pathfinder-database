import { parse as parseCSV } from 'https://deno.land/std@0.85.0/encoding/csv.ts';
import { parse as parseYAML, stringify } from 'https://deno.land/std@0.85.0/encoding/yaml.ts';

const IDS = {
  'parade armor': 'parade',
  'lamellar (leather)': 'lamellar',
  'lamellar (horn)': 'lamellar',
  'lamellar (steel)': 'lamellar',
  'lamellar (iron)': 'lamellar',
  'lamellar (stone coat)': 'lamellar',
  stoneplate: 'stone plate',
  'madu, leather': 'madu',
  'madu, steel': 'madu',
  'shield, light steel': 'light steel shield',
  'shield, light wooden': 'light wooden shield',
  'shield, heavy steel': 'heavy steel shield',
  'shield, heavy wooden': 'heavy wooden shield',
};

const materialTranslates = {
  leather: '皮革',
  horn: '兽角',
  steel: '钢材',
  iron: '镔铁',
  'stone coat': '岩块',
};

function translateLamellar(name) {
  const material = name.replace('Lamellar (', '').replace(')', '');

  return `板鳞甲 (${materialTranslates[material]})`;
}

function translateMadu(name) {
  const material = name.replace('Madu, ', '');

  return `马杜, ${materialTranslates[material]}`;
}

function pickArmor(obj, keys) {
  const newObj = {};

  Object.keys(obj).forEach((k) => {
    if (keys.includes(k)) {
      const v = obj[k];

      if (v === '—' || !v) {
        return;
      }

      newObj[k] = obj[k];
    }
  });

  return newObj;
}

const dataFile = await Deno.readTextFile('./chef/data/armors.csv');
const descFile = (
  await Promise.all(
    ['./chef/data/armors/normal.yaml', './chef/data/armors/aa2.yaml'].map((f) =>
      Deno.readTextFile(f)
    )
  )
).join('\n');

const data = await parseCSV(dataFile, {
  columns: [
    'name',
    'cost',
    'ac',
    'maxDex',
    'penalty',
    'arcaneFailureChance',
    'speed30',
    'speed20',
    'weight',
    'source',
  ],
});

const descriptions = {};

(await parseYAML(descFile)).forEach((d) => {
  descriptions[d.id.toLowerCase()] = d;
});

const armors = [];
const pickFields = [
  'cost',
  'ac',
  'maxDex',
  'penalty',
  'arcaneFailureChance',
  'speed30',
  'speed20',
  'weight',
];

let category = null;
for (const c of data) {
  if (c.name.endsWith('Armors') || c.name.endsWith('Shields')) {
    category = c.name.replace(' Armors', '').replace('Shields', 'shield').toLowerCase();

    continue;
  }

  const meta = pickArmor(c, pickFields);

  meta.weight = parseInt(meta.weight.replace(/lbs?\./, '').trim());
  meta.ac = Number.isNaN(parseInt(meta.ac)) ? 0 : parseInt(meta.ac);
  meta.penalty = Number.isNaN(parseInt(meta.penalty)) ? 0 : parseInt(meta.penalty);

  if (meta.maxDex) {
    meta.maxDex = parseInt(meta.maxDex);
  }

  if (meta.speed20) {
    meta.speed20 = parseInt(meta.speed20.replace(/ft?\./, '').trim());
  }
  if (meta.speed30) {
    meta.speed30 = parseInt(meta.speed30.replace(/ft?\./, '').trim());
  }

  if (c.name === 'Buckler') {
    meta.buckler = true;
  }

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
    if (c.name.startsWith('Lamellar')) {
      name = translateLamellar(c.name);
    } else if (c.name.startsWith('Madu')) {
      name = translateMadu(c.name);
    } else {
      name = d.name;
    }

    desc = d.desc;
  }

  const armor = {
    id: c.name,
    name,
    desc,
    meta: {
      category,
      ...meta,
    },
  };

  armors.push(armor);
}

Deno.writeTextFile(`pf-database/armor-types.yaml`, stringify(armors, { lineWidth: -1 }));
