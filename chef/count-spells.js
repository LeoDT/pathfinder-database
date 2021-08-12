import { parse } from 'https://deno.land/std@0.104.0/encoding/yaml.ts';

const books = ['crb', 'arg', 'apg', 'uc', 'um', 'acg'];

const promises = books.map((b) => {
  const f = `pf-database/feats/${b}.yaml`;

  return Deno.readTextFile(f);
});

const files = (await Promise.all(promises)).join('\n');

const p = parse(files);

console.log(p.filter((s) => !s.meta.level).map((s) => s.id));
