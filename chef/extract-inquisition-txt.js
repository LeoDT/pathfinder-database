import { stringify } from 'https://deno.land/std@0.104.0/encoding/yaml.ts';

import { removeNewlines, removeSpaces, extractNameAndIdAndType } from './utils.js';

const powerIds = {
  狱火加身: 'Fear the Flames',
  侦测秘密: 'Detect Secrets',
};

const contents = await Deno.readTextFile('chef/data/inquisition.txt');

const powerRegex = /^.+?（.{2}）：/;

const success = [];
function commit(nameAndId, desc, powers) {
  const { id, name } = removeNewlines(removeSpaces(nameAndId))
    .replace('裁决：', '')
    .match(/(?<name>.+?)（(?<id>.+?)）.*?$/).groups;

  success.push({
    id,
    name,
    desc: removeNewlines(removeSpaces(desc)).replace('裁决之力：', ''),
    powers: powers.map((l) => {
      const line = removeNewlines(removeSpaces(l));
      const [nameAndId, desc] = line.split('）：');

      let { id, name, type } = nameAndId.match(
        /(?<name>[^a-zA-Z'\s]+?)(?<id>[a-zA-Z'`\s]+?)?（(?<type>.+?)$/
      ).groups;

      if (!id) {
        id = powerIds[name];
      }

      const power = {
        id: id.trim().replace('`', "'"),
        name,
        type: type.toLowerCase(),
        desc,
        effects: [{ type: 'classFeatSource' }],
      };

      const { level } = desc.match(/在(?<level>\d+)级/)?.groups ?? {};
      if (level) {
        power.effectsWhen = `inquisitorLevel >= ${level}`;
      }

      return power;
    }),
  });
}

let nameAndId = '';
let desc = '';
let powers = [];

for (const l of contents.split('\n')) {
  const line = l.trim();

  if (line.startsWith('裁决：')) {
    if (nameAndId && desc) {
      commit(nameAndId, desc, powers);

      nameAndId = '';
      desc = '';
      powers = [];
    }

    nameAndId = line;
  }

  if (line.startsWith('裁决之力：')) {
    desc = line;
  }

  if (powerRegex.test(line)) {
    powers.push(line);
  }
}

if (nameAndId && desc) {
  commit(nameAndId, desc, powers);
}

Deno.writeTextFile(
  `pf-database/inquisitions.yaml`,
  stringify(
    success.sort((a, b) => (a.id.toLowerCase() > b.id.toLowerCase() ? 1 : -1)),
    { lineWidth: -1 }
  )
);
