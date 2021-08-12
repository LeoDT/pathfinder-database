import cheerio from 'https://dev.jspm.io/npm:cheerio@1.0.0-rc.5/index.js';
import { stringify } from 'https://deno.land/std@0.104.0/encoding/yaml.ts';

import { removeNewlines, removeSpaces } from './utils.js';
import { convertTable } from './html-utils.js';
import {
  spellMetaFromTexts,
  startsWithMetaKey,
  initSpellIndex,
  spellMetaFromIndex,
} from './spell-utils.js';

const books = ['crb', 'arg', 'apg', 'uc', 'um', 'acg'];

const spellNameRegex = /^[\S]+?\s?[(|（][a-zA-Z\s',\-\/]+[)）]$/;
const dumbSpellNameRegex = /^[a-zA-Z\s',`]+$/;
const spellIndex = await initSpellIndex();

const spellIdReplacer = {
  'dominate animal': 'Dominate Animal',
  'dominate monster': 'Dominate Monster',
  'dominate person': 'Dominate Person',
  'Vampiric touch': 'Vampiric Touch',
};

for (const book of books) {
  const contents = await Deno.readTextFile(`converted/Spell ${book.toUpperCase()}.html`);
  const $ = cheerio.load(contents);

  $('span[style*=009900]').remove();

  const allSpellNames = [];

  $('body > p')
    .get()
    .forEach((p) => {
      const $p = $(p);
      if ($p.find('span[style*=cc00cc]').length === 1) {
        allSpellNames.push($p);
      } else {
        const text = removeNewlines(removeSpaces($p.text()));
        const prevText = removeNewlines(removeSpaces($p.prev().text()));

        if (spellNameRegex.test(text) && prevText === '') {
          allSpellNames.push($p);
        }

        if (dumbSpellNameRegex.test(text)) {
          $p.remove();
        }
      }
    });

  const success = [];
  const failed = [];

  for (let i = 0; i < allSpellNames.length; i++) {
    const nameElWrapper = allSpellNames[i];
    const nextNameElWrapper = i + 1 === allSpellNames.length ? null : allSpellNames[i + 1];
    const metaTable = nameElWrapper.next('table');
    let metaEl = [];
    let descriptionEls = [];

    if (metaTable.length === 0) {
      const all = nameElWrapper.nextUntil(nextNameElWrapper).get();

      const index = all.findIndex((el) => {
        const $el = $(el);
        const text = removeNewlines(removeSpaces($el.text()));

        return !startsWithMetaKey(text);
      });

      if (index > 0) {
        metaEl = all.slice(0, index);
        descriptionEls = all.slice(index);
      }
    } else {
      metaEl = metaTable.find('p').get();
      descriptionEls = nextNameElWrapper
        ? metaTable.nextUntil(nextNameElWrapper)
        : metaTable.nextAll();
    }

    if (metaEl.length === 0 || descriptionEls.length === 0) {
      failed.push(nameElWrapper.text());

      continue;
    }

    const nameAndId = nameElWrapper.text();
    const metaTexts = metaEl
      .map((el) => removeSpaces(removeNewlines($(el).text())).trim())
      .filter((t) => t);

    const descriptionRows = [];
    for (let j = 0; j < descriptionEls.length; j++) {
      const $el = $(descriptionEls[j]);

      if ($el.is('table')) {
        descriptionRows.push(convertTable($, $el).replace('\r\n', '\n'));
      } else {
        descriptionRows.push(
          $el
            .text()
            .replace(/(\r\n|\n|\r)/g, '')
            .trim()
        );
      }
    }
    const desc = descriptionRows.join('\n').trim();

    let [name, id] = nameAndId
      .replace(/(\r\n|\n|\r)/gi, '')
      .replace(/(.*?)\s?[(（](.*?)[)）]/, '$1+$2')
      .split('+');

    // spell name in arg is messed up
    id = id.replace(/\s?\[.*?\]$/, '').replace(', 又译９命', '');

    success.push({
      id: spellIdReplacer[id] ?? id,
      name,
      meta: {
        ...spellMetaFromIndex(spellIndex, id),
        ...spellMetaFromTexts(metaTexts),
      },
      desc,
    });
  }

  console.log('failed spells');
  console.log(failed);

  Deno.writeTextFile(
    `pf-database/spells/${book}.yaml`,
    stringify(
      success.sort((a, b) => (a.id.toLowerCase() > b.id.toLowerCase() ? 1 : -1)),
      { lineWidth: -1 }
    )
  );
}
