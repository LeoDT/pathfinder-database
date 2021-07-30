import { parse as parseYAML } from 'https://deno.land/std@0.85.0/encoding/yaml.ts';
import { titleCase } from 'https://unpkg.com/title-case@3.0.3/dist.es2015/index.js';

const spellFiles = ['acg', 'apg', 'arg', 'crb', 'uc', 'um'].map((b) =>
  parseYAML(Deno.readTextFileSync(`./pf-database/spells/${b}.yaml`))
);

const spells = new Map();
for (const ss of spellFiles) {
  for (const s of ss) {
    spells.set(s.id, s);
  }
}

const domains = parseYAML(Deno.readTextFileSync('./pf-database/domains.yaml'));

const romeNumberRegex = /^[iIvVxX]+$/;

function fixDomainSpellId(id) {
  const lower = ['From', 'Against'];
  const suffixes = ['Greater', 'Lesser', 'Mass'];
  const splitted = titleCase(id).split(' ');
  const replacers = {
    'geas/quest': 'Geas/Quest',
    'blindness/deafness': 'Blindness/Deafness',
    'summon monster vd3幽影': 'Summon Monster V',
    'create greater undead': 'Create Greater Undead',
    'elemental body': 'Elemental Body IV',
    'remove blindness/deafness': 'Remove Blindness/Deafness',
    'antilife shield': 'Antilife Shell',
    "draljon's breath": "Dragon's Breath",
    'summon natures ally iv': "Summon Nature's Ally IV",
    'summon natures ally vii': "Summon Nature's Ally VII",
    'animate object': 'Animate Objects',
    Suffocate: 'Suffocation',
    'Create Greater Undead': 'Create Greater Undead',
  };

  if (replacers[id]) {
    return replacers[id];
  }

  let result = [];
  let suffix = '';
  for (let s of splitted) {
    s = s.replace(',', '');
    if (suffixes.includes(s)) {
      suffix = s;
      continue;
    }

    if (lower.includes(s)) {
      s = s.toLowerCase();
    }

    if (romeNumberRegex.test(s)) {
      s = s.toUpperCase();
    }

    result.push(s);
  }

  return `${result.join(' ')}${suffix ? `, ${suffix}` : ''}`;
}

for (const domain of domains) {
  if (domain.spells) {
    for (const s of domain.spells) {
      const id = fixDomainSpellId(s);

      if (!spells.get(id)) {
        console.log(s, id);
      }
    }
  }
}

/* for (const domain of domains) {
  if (domain.subDomains) {
    for (const d of domain.subDomains) {
      if (d.spells) {
        for (const s of d.spells) {
          if (!spells.get(s)) {
            console.log(s);
          }
        }
      }
    }
  }
} */
