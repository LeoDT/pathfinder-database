import { parse as parseCSV } from 'https://deno.land/std@0.104.0/encoding/csv.ts';
import { stringify } from 'https://deno.land/std@0.104.0/encoding/yaml.ts';

const file = await Deno.readTextFile('./chef/data/monk-qinggong.csv');
const data = await parseCSV(file, {
  columns: ['name', 'type', 'ki', 'special'],
});

let level = 0;
const results = [];

const typeTranlates = {
  feat: '专长',
  spell: '法术',
  other: '武僧能力',
};

for (const { name, type, ki, special } of data) {
  if (/^\d+级/.test(name)) {
    level = parseInt(name.replace('级'));
    continue;
  }

  const [realName, id] = name.replace(/(.*?)\s?[(（](.*?)[)）]/, '$1+$2').split('+');
  const realType = type.includes('专长') ? 'feat' : type.includes('法术') ? 'spell' : 'other';

  results.push({
    id,
    name: realName,
    desc: `${ki !== '-' ? `消耗${ki}点真气,` : ''}${special ? `${special}, ` : ''}即${
      typeTranlates[realType]
    }${realName}(${id})`,
    when: `monkunchainedLevel >= ${level}`,
  });
}

console.log(stringify(results, { lineWidth: -1 }));
