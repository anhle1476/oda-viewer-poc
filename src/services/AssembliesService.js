import ClientFactory from "../ClientFactory";
import { JOB_STATUS } from "../components/StatusTag";

class AssembliesService {
  async getAssemblies(page, pageSize, name) {
    const client = ClientFactory.get();
    const assemblies = await client.getAssemblies((page - 1) * pageSize, pageSize, name, null, true);

    assemblies.result.forEach((assembly) => {
      assembly.done = assembly.status === JOB_STATUS.DONE || assembly.status === JOB_STATUS.FAILED;
    });

    return assemblies;
  }
}

export default new AssembliesService();
