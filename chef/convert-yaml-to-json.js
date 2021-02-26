import { parse as parseYAML } from 'https://deno.land/std@0.85.0/encoding/yaml.ts';
import {
  resolve as pathResolve,
  basename as pathBasename,
} from 'https://deno.land/std@0.85.0/path/mod.ts';

function mergeMap(items, file) {
  const book = pathBasename(file, '.yaml');

  return items.map((item) => ({ ...item, book }));
}

function mergeDone(collections) {
  return collections
    .reduce((acc, col) => acc.concat(col), [])
    .sort((a, b) => (a.id.toLowerCase() > b.id.toLowerCase() ? 1 : -1));
}

const baseDir = './pf-database';
const targetDir = './pathfinder-workbench/src/data';

const converters = [
  {
    dir: 'spells',
    map: mergeMap,
    done: mergeDone,
  },
  {
    dir: 'feats',
    map: mergeMap,
    done: mergeDone,
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
  if (entry.isDirectory) {
    const converter = converters.find((c) => c.dir === entry.name);

    results.push({
      name: entry.name,
      content: await convertDir(entry, converter),
    });
  }

  if (entry.isFile) {
    const converter = converters.find((c) => c.file === pathBasename(entry.name, '.yaml'));

    results.push({
      name: pathBasename(entry.name, '.yaml'),
      content: await convertFile(entry, converter),
    });
  }
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
