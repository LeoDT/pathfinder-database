import { parse as parseYAML } from 'https://deno.land/std@0.85.0/encoding/yaml.ts';
import { parse as parseCSV } from 'https://deno.land/std@0.85.0/encoding/csv.ts';

const weaponsYaml = parseYAML(
  [
    './chef/data/weapons/aa2.yaml',
    './chef/data/weapons/exotic.yaml',
    './chef/data/weapons/martial.yaml',
    './chef/data/weapons/simple.yaml',
  ]
    .map((f) => {
      return Deno.readTextFileSync(f);
    })
    .join('\n')
);

const csv = [
  Deno.readTextFileSync('./chef/data/weapons.csv'),
  Deno.readTextFileSync('./chef/data/weapons_eastern.csv'),
].join('\n');

const weaponCSV = await parseCSV(csv, {
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

const ids = weaponCSV.map((w) => w.name.toLowerCase());

weaponsYaml.forEach((w) => {
  if (!ids.includes(w.id.toLowerCase())) {
    console.log(w.id);
  }
});
