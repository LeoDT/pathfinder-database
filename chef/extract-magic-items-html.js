import cheerio from 'https://dev.jspm.io/npm:cheerio@1.0.0-rc.5/index.js';
import { stringify } from 'https://deno.land/std@0.104.0/encoding/yaml.ts';

import { removeNewlines } from './utils.js';
import { initMagicItemsIndex, variantName } from './magic-items-utils.js';

const nameRegex = /^[^\s·]+?\s?[(|（]?[a-zA-Z\s',’\-\/]+[)）]?[\/A-Z\s]*$/;
const notLineRegex =
  /^(【PFS】|灵光：|价格：|位置：|制造条件：|制造成本：|制造条件；|制造成本:|施法者等级：|制造要求：|制作花费：|\+\d加值|中等变化系灵光|强烈咒法系和变化系灵光|需求：|成本：|【速查】)/;

const idReplacer = {
  'bonebreaker gauntlets': 'bonebreaker bracers',
  'shawl of lifekeeping': 'shawl of life-keeping',
  'steelmind cap': 'steel-mind cap',
  'x ring of x-ray vision': 'ring of x-ray vision',
};

const files = {
  ring: 'page_220.html',
  belt: 'page_223.html',
  body: 'page_224.html',
  chest: 'page_225.html',
  eyes: 'page_226.html',
  feet: 'page_227.html',
  hand: 'page_228.html',
  head: 'page_229.html',
  headband: 'page_230.html',
  neck: 'page_231.html',
  shoulders: 'page_232.html',
  wrists: 'page_233.html',
  none: 'page_234.html',
};

const [index, indexWithVariant] = await initMagicItemsIndex();

const failed = [];
for (const [slot, filename] of Object.entries(files)) {
  const file = await Deno.readTextFile(`converted/${filename}`);
  const $ = cheerio.load(removeNewlines(file));
  const success = [];

  const firstTable = $('table').first();
  if (firstTable.parent().is('body')) {
    firstTable.prevAll().remove().end().remove();
  } else {
    firstTable.parentsUntil('body').prevAll().remove().end().remove();
  }

  $('br').after('<div>\n</div>');

  const lines = $('body').text().split('\n');

  const commit = (item) => {
    const id = idReplacer[item.id] ?? item.id;

    const fromIndex = index.get(id);
    let withVariant = [];

    if (!fromIndex) {
      withVariant = indexWithVariant.get(id) ?? [];
    }

    const items = [...withVariant, fromIndex].filter((i) => i);

    if (items.length === 0) {
      failed.push(item);
    }

    items.forEach((itemFromIndex) => {
      if (!item.desc || !item.name) {
        failed.push(item);
      }

      const realItem = {
        id: itemFromIndex.Name,
        name: variantName(itemFromIndex.Name, item.name),
        desc: item.desc.join('\n'),
        meta: {
          group: itemFromIndex.Group.toLowerCase(),
          price: itemFromIndex.Price.replace(/,/g, ''),
          weight: parseFloat(itemFromIndex.WeightValue),
          casterLevel: itemFromIndex.CL ? parseInt(itemFromIndex.CL) : undefined,
          aura: itemFromIndex.Aura,
          slot,
        },
      };

      if (itemFromIndex.BaseItem) {
        realItem.meta.baseItem = itemFromIndex.BaseItem;
      }

      success.push(realItem);
    });
  };

  let item = null;
  for (let line of lines) {
    line = line.trim();

    if (!line || notLineRegex.test(line)) continue;

    if (nameRegex.test(line)) {
      if (item) {
        commit(item);

        item = null;
      }

      const realLine = line.replace('’', "'");
      const id = removeNewlines(
        realLine
          .replace(/\s?\/\s?[A-Z]+$/, '')
          .replace(/[^a-zA-Z\s,'-]/g, '')
          .toLowerCase()
      );
      const name = removeNewlines(realLine.replace(/[a-zA-Z\s',’\-\/(（)）]/g, ''));

      item = {
        id,
        name,
        desc: [],
        slot,
      };
    } else {
      if (item) {
        item.desc.push(line);
      }
    }
  }

  if (item) {
    commit(item);

    item = null;
  }

  Deno.writeTextFile(
    `pf-database/magic-item-types/${slot}.yaml`,
    stringify(
      success.sort((a, b) => (a.id.toLowerCase() > b.id.toLowerCase() ? 1 : -1)),
      { lineWidth: -1 }
    )
  );
}

console.log(`failed`);
console.log(failed.map((i) => [i.slot, i.id]));
