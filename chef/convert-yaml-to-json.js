import { parse as parseYAML } from 'https://deno.land/std@0.85.0/encoding/yaml.ts';
import {
  resolve as pathResolve,
  basename as pathBasename,
  join as pathJoin,
} from 'https://deno.land/std@0.85.0/path/mod.ts';

import { compose } from './utils.js';
import { spellLevelFromText } from './spell-utils.js';

const baseDir = './pf-database';
const targetDir = './pathfinder-workbench/src/data';

const featEffects = parseYAML(Deno.readTextFileSync(`${baseDir}/feat-effects.yaml`));
const featEffectsIndex = new Map();
featEffects.forEach((f) => {
  featEffectsIndex.set(f.id, f);
});
function featPatchMap(items) {
  const results = [];

  for (const item of items) {
    if (item.book === 'crb' && ['Rapid Reload', 'Extra Channel'].includes(item.id)) {
      continue;
    }

    if (item.book === 'apg' && ['Extra Hex'].includes(item.id)) {
      continue;
    }

    const patch = featEffectsIndex.get(item.id);

    if (patch) {
      Object.assign(item, patch);
    }

    results.push(item);
  }

  return results;
}

function mergeMap(items, file) {
  const book = pathBasename(file, '.yaml');

  return items.map((item) => ({ ...item, book }));
}

function mergeDone(collections) {
  return collections.reduce((acc, col) => acc.concat(col), []);
}

function sortDone(collections) {
  return collections.sort((a, b) => (a.id.toLowerCase() > b.id.toLowerCase() ? 1 : -1));
}

const converters = [
  {
    dir: 'weapon-types',
    done: compose(sortDone, mergeDone),
  },
  {
    dir: 'spells',
    map: mergeMap,
    done: compose(sortDone, mergeDone),
    produceMore: (spells) => {
      const spellByClassLevel = {};

      spells.forEach((s) => {
        const cls = spellLevelFromText(s.meta.level);

        cls.forEach(([c, l]) => {
          if (!spellByClassLevel[c]) {
            spellByClassLevel[c] = Array(10)
              .fill(1)
              .map(() => []);
          }

          const level = parseInt(l);

          if (!spellByClassLevel[c][level]) {
            spellByClassLevel[c][level] = [];
          }

          spellByClassLevel[c][level].push(s.id);
        });
      });

      return [{ name: 'spell-by-class-level', content: spellByClassLevel }];
    },
  },
  {
    dir: 'feats',
    map: compose(featPatchMap, mergeMap),
    done: compose(sortDone, mergeDone),
  },
  {
    file: 'core-skills',
    done: (skills) => {
      const converted = [];

      skills.forEach((s) => {
        if (s.category) {
          converted.push({
            id: s.id,
            name: s.name,
            category: true,
            ability: s.ability,
          });

          s.subs?.forEach((sub) => {
            converted.push({
              id: `${s.id}(${sub.id})`,
              name: `${s.name}(${sub.name})`,
              ability: s.ability,
              parent: s.id,
            });
          });
        } else {
          converted.push(s);
        }
      });

      return converted;
    },
  },
  {
    dir: 'classes',
    done: compose(sortDone),
  },
  {
    dir: 'archetypes',
    done: compose(sortDone, mergeDone),
  },
];

async function convertDir(dirEntry, converter) {
  const entries = Deno.readDir(pathResolve(baseDir, dirEntry.name));

  let collections = [];
  for await (const entry of entries) {
    if (entry.isFile) {
      const file = await Deno.readTextFile(pathResolve(baseDir, dirEntry.name, entry.name));
      let loaded = parseYAML(file);

      if (!loaded) {
        console.warn(`${dirEntry.name} is not a valid yaml file`);
        continue;
      }

      if (converter?.map) {
        loaded = converter.map(loaded, entry.name);
      }

      collections.push(loaded);
    } else if (entry.isDirectory) {
      collections = collections.concat(
        await convertDir({ ...entry, name: pathJoin(dirEntry.name, entry.name) }, converter)
      );
    }
  }

  if (converter?.done) {
    collections = converter.done(collections);
  }

  return collections;
}

async function convertFile(fileEntry, converter) {
  const file = await Deno.readTextFile(pathResolve(baseDir, fileEntry.name));

  let loaded = parseYAML(file);

  if (converter?.map) {
    loaded = converter.map(loaded, fileEntry.name);
  }

  if (converter?.done) {
    loaded = converter.done(loaded);
  }

  return loaded;
}

const results = [];

for await (const entry of Deno.readDir(baseDir)) {
  let converter = null;
  let name = null;
  let content = null;

  if (entry.isDirectory) {
    converter = converters.find((c) => c.dir === entry.name);
    name = entry.name;
    content = await convertDir(entry, converter);
  }

  if (entry.isFile) {
    converter = converters.find((c) => c.file === pathBasename(entry.name, '.yaml'));
    name = pathBasename(entry.name, '.yaml');
    content = await convertFile(entry, converter);
  }

  if (converter?.produceMore) {
    converter.produceMore(content)?.forEach((r) => results.push(r));
  }

  if (name && content) {
    results.push({ name, content });
  }

  converter = null;
  name = null;
  content = null;
}

try {
  await Deno.remove(targetDir, { recursive: true });
} catch (e) {
} finally {
  await Deno.mkdir(targetDir);
}

for (const result of results) {
  await Deno.writeTextFile(
    pathResolve(targetDir, `${result.name}.json`),
    JSON.stringify(result.content)
  );

  console.log(`${result.name} success`);
}
