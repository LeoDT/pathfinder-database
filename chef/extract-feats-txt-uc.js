import { stringify } from 'https://deno.land/std@0.85.0/encoding/yaml.ts';

import { removeNewlines, removeSpaces } from './utils.js';
import { startsWithMetaKey, featMetaFromTexts, featTypeFromText } from './feat-utils.js';

const featNameRegex = /^(?<name>[^：【]+?)\s?（(?<id>[^。、]+?)）〔?(?<type>.*?)〕?$/;

const file = await Deno.readTextFile('./chef/data/uc-feat.txt');
const lines = file.split(/(\n|\r|\n\r)/);
const feats = [];

function isFeatName(text) {
  return featNameRegex.test(text);
}

function convertToFeat(featTexts) {
  const nameAndIdAndType = featTexts.name.match(featNameRegex).groups;
  const meta = featMetaFromTexts(featTexts.metaLines);
  const description = featTexts.descriptionLines.join('\n');
  const brief = featTexts.briefLines.join('\n');

  const feat = {
    ...nameAndIdAndType,
    type: nameAndIdAndType.type ? featTypeFromText(nameAndIdAndType.type) : ['general'],
    meta,
  };

  if (feat.id.search('，') !== -1) {
    feat.id = feat.id.split('，')[0];
  }

  if (brief) {
    feat.brief = brief;
  }

  if (description) {
    feat.desc = description;
  }

  return feat;
}

let currentFeat = null;
for (const l of lines) {
  const line = l.trim();

  if (!line) continue;

  if (isFeatName(line)) {
    if (currentFeat) {
      feats.push(convertToFeat(currentFeat));
    }

    currentFeat = {
      name: line,
      briefLines: [],
      metaLines: [],
      descriptionLines: [],
    };
  } else if (startsWithMetaKey(line)) {
    currentFeat.metaLines.push(line);
  } else if (currentFeat.metaLines.length === 0) {
    currentFeat.briefLines.push(line);
  } else {
    currentFeat.descriptionLines.push(line);
  }
}

Deno.writeTextFile(
  `pf-database/feats/uc.yaml`,
  stringify(
    feats.sort((a, b) => (a.id.toLowerCase() > b.id.toLowerCase() ? 1 : -1)),
    { lineWidth: -1 }
  )
);
