import { initSpellIndex } from './spell-utils.js';

const index = await initSpellIndex();

console.log(index.get('groundswell'));
