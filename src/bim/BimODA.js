import BimClient from "./api/BimClient";

export default class BimODA {
  /**
   * Create instance of the `Client` for working with specified server.
   *
   * @async
   * @param {Object} params            - An object containing client configuration parameters.
   * @param {string} params.serverUrl  - Open Cloud Server URL.
   * @param {string} [params.APIToken] - Specify API Key to sign in right now. The `serverUrl`
   *   must be also specified and server must be online or exception is thrown.
   * @returns {Promise<Client>}
   */
   static async createClient (params) {
    const client = new BimClient(params);
    if (params.APIToken) {
      await client.loginWithToken(params.APIToken);
    }
    return client;
  }
}