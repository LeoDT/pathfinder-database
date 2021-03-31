import { parse } from 'https://deno.land/std@0.85.0/encoding/csv.ts';
import { stringify } from 'https://deno.land/std@0.85.0/encoding/yaml.ts';

const c = await parse(
  `
—,1,1d2,1d3,1d4
1,1d2,1d3,1d4,1d6
1d2,1d3,1d4,1d6,1d8
1d3,1d4,1d6,1d8,2d6
1d4,1d6,1d8,2d6,3d6
1d6,1d8,1d10,2d8,3d8
1d8,1d10,1d12,3d6,4d6
1d4,1d6,2d4,2d6,3d6
1d8,1d10,2d6,3d6,4d6
1d10,2d6,2d8,3d8,4d8
2d6,2d8,2d10,4d8,6d8
`,
  { columns: [, 'small', 'medium', 'large', 'huge'] }
);

const y = stringify(c);

console.log(y);
