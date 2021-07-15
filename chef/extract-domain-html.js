import cheerio from 'https://dev.jspm.io/npm:cheerio@1.0.0-rc.5/index.js';
import { stringify } from 'https://deno.land/std@0.85.0/encoding/yaml.ts';
import { titleCase } from 'https://unpkg.com/title-case@3.0.3/dist.es2015/index.js';

import { removeNewlines, removeSpaces, extractNameAndIdAndType } from './utils.js';

const domainPowerIds = {
  酸抗性: 'Acid Resistance',
};

const subDomainPowerIds = {
  终末降至: 'Hasten the End',
  无厘头: 'Unexpected Whimsy',
  月火: 'Moonfire',
  痛苦之击: 'Painful Smite',
  摄食恐惧: 'Feed on Fear',
  煽风点火: 'Call Fire',
  友情羁绊: 'Powerful Bond',
  忠诚之触: 'Touch of Loyalty',
  宰制指令: 'Master’s Yoke',
  暴君之击: 'Tyrannical Strike',
  漂流之宝: 'Sift',
  随波逐流: 'Current Flow',
  恐龙伙伴: 'Dinosaur Companion',
  剧毒唾液: 'Venomous Saliva',
  自外而来: 'It Came from Beyond',
  自闭灵光: 'Aura of Isolation',
  群星归位: 'The Stars Are Right',
};

const subDomainPowerReplace = {
  Thundercloud: 'Electricity Resistance',
  "Elysium's Call": (domainId) =>
    domainId === 'Chaos Domain' ? 'Touch of Chaos' : 'Touch of Good',
  'Fury of the Abyss': (domainId) =>
    domainId === 'Chaos Domain' ? 'Touch of Chaos' : 'Touch of Evil',
  Adoration: 'Dazing Touch',
  'Aura of Forgetfulness': 'Eyes of Darkness',
  "Hell's Corruption": (domainId) =>
    domainId === 'Evil Domain' ? 'Touch of Evil' : 'Touch of Law',
  'Aura of Menace': (domainId) => (domainId === 'Law Domain' ? 'Staff of Order' : 'Holy Lance'),
};

const druidDomains = ['Air', 'Animal', 'Earth', 'Fire', 'Plant', 'Water', 'Weather'];
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

const contents = await Deno.readTextFile(`converted/page_42.html`);
const $ = cheerio.load(contents);

const allDomainNames = [];
let endEl = [];

$('body > p')
  .get()
  .forEach((p) => {
    const $p = $(p);

    if ($p.find('span[style*="009900"][style*="14pt"]').length > 1) {
      allDomainNames.push($p);
    }

    if (
      $p.find('span[style*="c00000"][style*="16pt"]').length &&
      $p.text().includes('引导能量变体')
    ) {
      endEl = $p;
    }
  });

const success = [];

for (let i = 0; i < allDomainNames.length; i++) {
  const nameElWrapper = allDomainNames[i];
  const nextNameElWrapper = allDomainNames[i + 1];

  const all = (
    nextNameElWrapper ? nameElWrapper.nextUntil(nextNameElWrapper) : nameElWrapper.nextUntil(endEl)
  ).get();

  let descEl = null;
  const powerEls = [];
  let spellTable = null;
  let subDomainEls = [];

  // el searching
  for (const el of all) {
    const $el = $(el);

    if ($el.text().trim() === '') {
      continue;
    }

    if ($el.find('table').length) {
      if ($el.find('td[style*="f79646"]').length) {
        spellTable = $el;
      } else {
        subDomainEls = $el
          .find('td')
          .get()
          .map((td) => {
            const $td = $(td);

            const sub = {
              nameEl: null,
              powerEls: [],
              spellEl: null,
              descEl: null,
            };
            $td
              .find('p')
              .get()
              .forEach((p) => {
                const $p = $(p);

                if ($p.text().trim() === '') {
                  return;
                }

                if ($p.find('span[style*="009900"]').length) {
                  sub.nameEl = $p;
                  return;
                }

                if ($p.find('span[style*="0033cc"]').length) {
                  if ($p.text().trim().startsWith('替代领域法术')) {
                    sub.spellEl = $p;
                  } else {
                    sub.powerEls.push($p);
                  }

                  return;
                }

                if (sub.powerEls.length === 0) {
                  sub.descEl = $p;
                }
              });

            return sub;
          });
      }
      continue;
    }

    if ($el.find('span[style*="0033cc"]').length) {
      if ($el.text().trim().startsWith('神授力量')) {
        descEl = $el;
      } else {
        powerEls.push($el);
      }

      continue;
    }
  }

  const nameAndId = removeNewlines(removeSpaces(nameElWrapper.text()));
  const { name, id } = nameAndId.match(/(?<name>.+?)\s?（(?<id>.+?)）.*?$/).groups;

  const sharedWithDruid = druidDomains.includes(id.replace(' Domain', ''));

  const desc = removeNewlines(removeSpaces(descEl.text().replace('神授力量：', '')));
  const powers = powerEls.map((el) => {
    let { name, id, type } = extractNameAndIdAndType(
      removeNewlines(removeSpaces(el.find('span[style*="0033cc"]').text()))
    );

    const desc = removeNewlines(removeSpaces(el.text())).split('）：')[1];

    if (!id || id.length === 2) {
      //no id
      type = id;
      id = domainPowerIds[name];
    }

    const power = {
      name,
      id,
      type: type?.toLowerCase(),
      desc,
      effects: [{ type: 'classFeatSource' }],
    };

    const { level } = desc.match(/(在|到了)?(?<level>\d+)级/)?.groups ?? {};
    if (level) {
      power.effectsWhen = sharedWithDruid
        ? `OR(clericLevel >= ${level}, inquisitorLevel >= ${level}, druidLevel >= ${level})`
        : `OR(clericLevel >= ${level}, inquisitorLevel >= ${level})`;
    }

    return power;
  });
  const spells = spellTable
    .find('td')
    .get()
    .map((td) => {
      const $td = $(td);
      const text = removeNewlines(removeSpaces($td.text()));

      if (/^\d环/.test(text)) {
        const spellText = removeNewlines(removeSpaces($td.next('td').text())).replace(/UM$/, '');
        const { id } = extractNameAndIdAndType(spellText);

        if (id) return fixDomainSpellId(id.replace(/[^a-zA-Z\s'/]+/, '').toLowerCase());
      }
    })
    .filter((s) => s);

  const domainPowers = powers;
  const domainId = id;
  const subDomains = subDomainEls.map(({ nameEl, powerEls, spellEl, descEl }) => {
    const { name, id } = removeNewlines(removeSpaces(nameEl.text())).match(
      /(?<name>.+?)\s?（(?<id>.+?)）.*?$/
    ).groups;
    const powers = powerEls.map((el) => {
      let { name, id, type } = extractNameAndIdAndType(
        removeNewlines(removeSpaces(el.find('span[style*="0033cc"]').text())).replace('：', '')
      );

      const desc = removeNewlines(removeSpaces(el.text())).split('）：')[1];

      if (!id || id.length === 2) {
        // no id
        type = id;
        id = subDomainPowerIds[name];
      }

      const replaceRegex = new RegExp(`此能力(取代|替换).{1,2}领域的(.+?)能力`);
      const [, , replaceName] = desc.match(replaceRegex) || [];

      let replacePower = null;
      if (replaceName) {
        replacePower = domainPowers.find((p) => p.name === replaceName);
      }

      const sub = {
        name,
        id,
        type: type?.toLowerCase(),
        desc: desc.trim(),
        effects: [{ type: 'classFeatSource' }],
      };

      const { level } = desc.match(/(在|到了)?(?<level>\d+)级/)?.groups ?? {};
      if (level) {
        sub.effectsWhen = sharedWithDruid
          ? `OR(clericLevel >= ${level}, inquisitorLevel >= ${level}, druidLevel >= ${level})`
          : `OR(clericLevel >= ${level}, inquisitorLevel >= ${level})`;
      }

      if (replacePower) {
        sub.replace = [replacePower.id];
      } else {
        sub.replace = [
          typeof subDomainPowerReplace[id] === 'string'
            ? subDomainPowerReplace[id]
            : subDomainPowerReplace[id](domainId),
        ];
      }

      return sub;
    });
    const spells = removeNewlines(removeSpaces(spellEl.find('sup').remove().end().text()))
      .replace('替代领域法术：', '')
      .split('；')
      .map((s) => {
        if (s.includes('protection from chaos/evil/good/law')) {
          return [
            'Protection from Chaos',
            'Protection from Evil',
            'Protection from Good',
            'Protection from Law',
          ];
        }

        return fixDomainSpellId(
          s
            .replace(/^.*（/, '')
            .replace(/）.*$/, '')
            .replace(/,\sAPG/g, '')
            .replace('，', ' ')
            .replace(/[^a-zA-Z\s'/]/g, '')
            .toLowerCase()
        ).trim();
      })
      .flat();

    const sub = {
      id: id.replace(' Subdomain', ''),
      name: name.replace('子域', ''),
      powers,
      spells,
    };

    if (descEl) {
      sub.desc = removeNewlines(removeSpaces(descEl.text()));
    }

    return sub;
  });

  const domain = {
    id: id.replace(' Domain', ''),
    name: name.replace('领域', ''),
    desc,
    powers,
    spells,
    subDomains,
  };

  if (sharedWithDruid) {
    domain.druid = true;
  }

  success.push(domain);
}

Deno.writeTextFile(
  `pf-database/domains.yaml`,
  stringify(
    success.sort((a, b) => (a.id.toLowerCase() > b.id.toLowerCase() ? 1 : -1)),
    { lineWidth: -1 }
  )
);
