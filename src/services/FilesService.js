import path from "path";

import ClientFactory from "../ClientFactory";
import { JOB_STATUS } from "../components/StatusTag";

class FilesService {
  async getFiles(page, pageSize, name, ext) {
    const client = ClientFactory.get();
    const files = await client.getFiles((page - 1) * pageSize, pageSize, name, ext, null, true);

    files.result.forEach((file) => {
      if (file.geometryStatus === JOB_STATUS.NONE && file.propertiesStatus === JOB_STATUS.NONE)
        file.status = JOB_STATUS.NONE;
      else if (file.geometryStatus === JOB_STATUS.DONE && file.propertiesStatus === JOB_STATUS.DONE)
        file.status = JOB_STATUS.DONE;
      else if (file.geometryStatus === JOB_STATUS.DONE && file.propertiesStatus === JOB_STATUS.FAILED)
        file.status = JOB_STATUS.DONE;
      else if (file.geometryStatus === JOB_STATUS.IN_PROGRESS || file.propertiesStatus === JOB_STATUS.IN_PROGRESS)
        file.status = JOB_STATUS.IN_PROGRESS;
      else if (file.geometryStatus === JOB_STATUS.FAILED && file.propertiesStatus === JOB_STATUS.FAILED)
        file.status = JOB_STATUS.FAILED;
      else file.status = JOB_STATUS.WAITING;

      file.done =
        file.status === JOB_STATUS.NONE || file.status === JOB_STATUS.DONE || file.status === JOB_STATUS.FAILED;
    });

    return files;
  }

  async uploadFiles(drawingFile, referenceFiles) {
    const client = ClientFactory.get();

    const ext = path.extname(drawingFile.name).substring(1).toLowerCase();
    const supportFormats = ClientFactory.getConfig().supportFormats;
    const postJob = supportFormats.some((format) => format.toLowerCase() === ext);

    let references = [];

    for (let referenceFile of referenceFiles) {
      const file = await client.uploadFile(referenceFile, {
        geometry: false,
        properties: false,
        waitForDone: false,
      });
      references.push({ id: file.id, name: file.name });
    }

    const result = await client.uploadFile(drawingFile, {
      geometry: false,
      properties: false,
      waitForDone: false,
    });

    await result.setReferences({ references });

    console.log(result);

    if (postJob) {
      await result.extractGeometry();
      await result.extractProperties();
    }

    return result;
  }
}

export default new FilesService();
