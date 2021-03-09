import cheerio from 'https://dev.jspm.io/npm:cheerio@1.0.0-rc.5/index.js';
import { stringify } from 'https://deno.land/std@0.85.0/encoding/yaml.ts';

import { removeNewlines, removeSpaces } from './utils.js';
import { convertTable } from './html-utils.js';
import { startsWithMetaKey, featMetaFromTexts, featTypeFromText } from './feat-utils.js';

const books = {
  crb: 'page_195.html',
  apg: 'page_196.html',
  arg: 'page_197.html',
  acg: 'page_203.html',
  um: 'page_198.html',
  /* uc: 'page_199.html', */
};

for (const [bookName, bookHTML] of Object.entries(books)) {
  const contents = await Deno.readTextFile(`converted/${bookHTML}`);
  const $ = cheerio.load(contents);

  const allFeatNames = [];

  $('body > p')
    .get()
    .forEach((p) => {
      const $p = $(p);
      if (
        $p.find('span[style*=c00000]').length > 1 &&
        $p.find('span[style*=16pt], table').length === 0
      ) {
        allFeatNames.push($p);
      }
    });

  const success = [];
  const failed = [];

  for (let i = 0; i < allFeatNames.length; i++) {
    const nameElWrapper = allFeatNames[i];

    if (nameElWrapper.find('s').length > 0) {
      continue;
    }

    const nextNameElWrapper = i + 1 === allFeatNames.length ? null : allFeatNames[i + 1];

    const all = (nextNameElWrapper
      ? nameElWrapper.nextUntil(nextNameElWrapper)
      : nameElWrapper.nextAll()
    ).get();

    const briefEls = [];
    const metaEls = [];
    const descriptionEls = [];

    const firstMetaElIndex = all.findIndex((el) => {
      const $el = $(el);
      const text = removeNewlines(removeSpaces($el.text()));

      return startsWithMetaKey(text);
    });

    all.forEach((el, i) => {
      const $el = $(el);
      const text = removeNewlines(removeSpaces($el.text()));

      if (i < firstMetaElIndex) {
        briefEls.push($el);
      } else if (startsWithMetaKey(text)) {
        metaEls.push($el);
      } else {
        descriptionEls.push($el);
      }
    });

    const nameAndIdAndType = removeNewlines(removeSpaces(nameElWrapper.text())).match(
      bookName === 'acg'
        ? /^(?<name>\S+?)\s(?<id>[a-zA-Z-,\s`’]+)（?(?<type>.*?)）?$/
        : /(?<name>.+?)\s?（(?<id>.+?)）〔?(?<type>.*?)〕?$/
    ).groups;

    const brief = briefEls
      .map(($el) => removeNewlines(removeSpaces($el.text())))
      .filter((t) => t)
      .join('\n');
    const meta = featMetaFromTexts(
      metaEls.map(($el) => removeNewlines(removeSpaces($el.text()))).filter((t) => t)
    );
    const description = descriptionEls
      .map(($el) => {
        const table = $el.is('table')
          ? $el
          : $el.children().first().is('table')
          ? $el.children().first()
          : null;

        if (table) {
          return convertTable($, table).replace('\r\n', '\n');
        }

        return removeNewlines($el.text());
      })
      .join('\n')
      .trim();

    const feat = {
      ...nameAndIdAndType,
      type: nameAndIdAndType.type ? featTypeFromText(nameAndIdAndType.type) : ['general'],
      brief,
      meta,
    };

    if (description) {
      feat.desc = description;
    }

    const altNameIndex = feat.id.indexOf('，又译');
    if (altNameIndex !== -1) {
      const altName = feat.id.substring(altNameIndex).replace('，又译', '');
      if (altName !== feat.name) {
        feat.altName = altName;
      }

      feat.id = feat.id.substring(0, altNameIndex);
    }

    success.push(feat);
  }

  Deno.writeTextFile(
    `pf-database/feats/${bookName}.yaml`,
    stringify(
      success.sort((a, b) => (a.id.toLowerCase() > b.id.toLowerCase() ? 1 : -1)),
      { lineWidth: -1 }
    )
  );
}
