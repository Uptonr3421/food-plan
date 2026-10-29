// Snapshot ../data.js into a trip JSON:  node quest/tools/build_trip_from_datajs.mjs > quest/trips/aldi-week.json
// Uses the same adapter the app uses at runtime (js/adapter.js), so output == what the app shows.
import fs from 'node:fs'; import vm from 'node:vm'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { tripFromFood } from '../js/adapter.js';
const here = path.dirname(fileURLToPath(import.meta.url));
const ctx = { window: {} }; vm.runInNewContext(fs.readFileSync(path.join(here, '..', '..', 'data.js'), 'utf8'), ctx);
process.stdout.write(JSON.stringify(tripFromFood(ctx.window.FOOD), null, 1) + '\n');
