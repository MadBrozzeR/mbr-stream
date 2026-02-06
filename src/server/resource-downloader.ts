import fs from 'fs/promises';
import path from 'path';
import { config } from './config';
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

export function downloadResources () {
  return new Promise<Record<string, boolean>>(function (resolve) {
    const promises: Array<Promise<FileStatus>> = [];

    for (const fileName in config.download) {
      if (config.download[fileName]) {
        promises.push(getFile({ file: fileName, source: config.download[fileName] }))
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
