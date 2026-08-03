import fs from 'fs/promises';
import path from 'path';
import { doRequest, getResponseData } from './utils';

type Resource = {
  file: string;
  source: string;
};

type FileStatus = {
  file: string;
  status: boolean;
}

const ROOT = __dirname + '/../../static/downloaded/';

function checkExists (fileName: string) {
  return fs.access(fileName, fs.constants.R_OK)
    .then(function () {
      return true;
    })
    .catch(function () {
      return false;
    });
}

async function download (fileName: string, source: string) {
  const response = await doRequest(source);
  const data = await getResponseData(response);
  const directory = path.dirname(fileName);
  await fs.mkdir(directory, { recursive: true });
  await fs.writeFile(fileName, data);

  return true;
}

function getFile (resource: Resource): Promise<FileStatus> {
  const file = ROOT + resource.file;

  return checkExists(file)
    .then(function (fileExists) {
      if (fileExists) {
        return { file: resource.file, status: true };
      } else {
        console.log(`Downloading resource: ${resource.file}`);
        return download(file, resource.source)
          .then(function () {
            return { file: resource.file, status: true };
          })
          .catch(function () {
          return { file: resource.file, status: false };
        });
      }
    });
}

export function downloadResources (resources: Record<string, string>) {
  return new Promise<Record<string, boolean>>(function (resolve) {
    const promises: Array<Promise<FileStatus>> = [];

    for (const fileName in resources) {
      if (resources[fileName]) {
        promises.push(getFile({ file: fileName, source: resources[fileName] }))
      }
    }

    return Promise.all(promises).then(function (results) {
      resolve(results.reduce<Record<string, boolean>>(function (result, item) {
        result[item.file] = item.status;

        return result;
      }, {}));
    });
  });
}

export const PRELOAD_RESOURCES = {
  'sound/witch-ambient1.ogg': 'https://resources.download.minecraft.net/31/312745ed858214dfc2215346cd9a3012c90018b5',
  'sound/raidhorn4.ogg': 'https://resources.download.minecraft.net/3b/3beb96e88535529e6e24f557e927fffd57956a3a',
  'sound/amethyst-break1.ogg': 'https://resources.download.minecraft.net/97/97b47b7a62f22addf6ff1db0c57b2fce22504098',
  'sound/zombie-say1.ogg': 'https://resources.download.minecraft.net/65/65b762da90c8b192ee065692fcd50068f571b3fc',
  'sound/zombie-say3.ogg': 'https://resources.download.minecraft.net/7e/7e86ced51d049411a28627854c633a3977f45332',
};
