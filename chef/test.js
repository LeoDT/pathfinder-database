import { parse } from 'https://deno.land/std@0.85.0/encoding/yaml.ts';

let text = '';
for await (const entry of Deno.readDir('./pf-database/feats')) {
  text += await Deno.readTextFile(`./pf-database/feats/${entry.name}`);
}

const feats = parse(text);

const types = new Set();

for (const f of feats) {
  for (const t of f.type) {
    types.add(t);
  }
}

console.log(types);
