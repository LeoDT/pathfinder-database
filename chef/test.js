const f = await Deno.readTextFile('./pathfinder-workbench/src/data/feats.json');

const json = JSON.parse(f);

const set = new Set();

json.forEach(({ type }) => {
  set.add(type);
});

console.log(Array.from(set));
