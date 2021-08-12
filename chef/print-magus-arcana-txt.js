import { stringify } from 'https://deno.land/std@0.104.0/encoding/yaml.ts';

import {
  removeNewlines,
  removeSpaces,
  extractNameAndIdAndType,
  nameAndIdAndTypeRegex,
} from './utils.js';

const contents = await Deno.readTextFile('chef/data/magus-arcana.txt');

const success = [];
function commit(nameAndId, desc, level) {
  const { id, name, type } = extractNameAndIdAndType(removeNewlines(removeSpaces(nameAndId)));

  if (id === 'Deadly Dealer') return;

  const l = level.replace(/[^\d]/g, '');
  const r = {
    id,
    name,
    desc: removeNewlines(removeSpaces(desc)).replace('效果：', ''),
    when: `magusLevel >= ${l}`,
  };

  if (type) {
    r.type = type.toLowerCase();
  }

  success.push(r);
}

let nameAndId = '';
let level = '';
let desc = '';

for (const l of contents.split('\n')) {
  const line = l.trim();

  if (line.startsWith('【速查】') || line.startsWith('引用')) {
    continue;
  }

  if (nameAndIdAndTypeRegex.test(line.replace(/【[a-zA-Z]+】/, ''))) {
    if (nameAndId && desc && level) {
      commit(nameAndId, desc, level);

      nameAndId = '';
      desc = '';
      level = '';
    }

    nameAndId = line.replace(/【[a-zA-Z]+】/, '');
  }

  if (line.startsWith('效果：')) {
    desc = line;
  }

  if (line.startsWith('前提：')) {
    level = line;
  }
}

if (nameAndId && desc) {
  commit(nameAndId, desc, level);
}

console.log(
  stringify(
    success.sort((a, b) => (a.id.toLowerCase() > b.id.toLowerCase() ? 1 : -1)),
    { lineWidth: -1 }
  )
);
