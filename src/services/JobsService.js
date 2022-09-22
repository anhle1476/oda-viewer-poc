import ClientFactory from "../ClientFactory";

class JobsService {
  async getJobs(page, pageSize, status) {
    const client = ClientFactory.get();

    const jobs = await client.getJobs(status, pageSize, (page - 1) * pageSize, true);

    const fileIds = [];
    const assemblyIds = [];
    const nameMap = new Map();

    jobs.result.forEach((job) => {
      job.fileId ? fileIds.push(job.fileId) : assemblyIds.push(job.assemblyId);
    });

    const files = await client.getFiles(null, null, null, null, fileIds);
    files.result.forEach((file) => nameMap.set(file.id, file.name));

    const assemblies = await client.getAssemblies(null, null, null, assemblyIds);
    assemblies.result.forEach((assembly) => nameMap.set(assembly.id, assembly.name));

    jobs.result.forEach((job) => {
      job.name = job.fileId ? nameMap.get(job.fileId) : nameMap.get(job.assemblyId);
    });

    return jobs;
  }
}

export default new JobsService();
