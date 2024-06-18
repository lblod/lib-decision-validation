import * as fs from 'fs';

export function ensureDirectoryExistence(directoryPath: string) {
  if (fs.existsSync(directoryPath)) {
    return true;
  }
  fs.mkdirSync(directoryPath);
}
