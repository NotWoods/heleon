import { readFile, writeFile } from 'fs/promises';
import Fuse from 'fuse.js';
import { join } from 'path';
import type { GTFSData } from '../shared/gtfs-types';
import { createApiData } from './parse.js';

function writeJson(path: string, json: unknown) {
  const str = JSON.stringify(json);
  return writeFile(path, str, { encoding: 'utf8' });
}

async function generateIndexes(api: GTFSData) {
  const routes = Object.values(api.routes);
  const stops = Object.values(api.stops);

  const routeIndex = Fuse.createIndex(['route_long_name'], routes);
  const stopIndex = Fuse.createIndex(['stop_name'], stops);

  return {
    routes: routeIndex.toJSON(),
    stops: stopIndex.toJSON(),
  };
}

/**
 * Generate an API file from the given GTFS zip path.
 * @param gtfsZipPath
 */
export async function generateApi(
  gtfsZipPath: string,
  apiFolder: string,
): Promise<void> {
  const zipData = await readFile(gtfsZipPath, { encoding: null });
  const api = await createApiData(zipData);
  const indexes = await generateIndexes(api);

  await Promise.all([
    writeJson(join(apiFolder, 'api.json'), api),
    writeJson(join(apiFolder, 'indexes.json'), indexes),
  ]);
}
