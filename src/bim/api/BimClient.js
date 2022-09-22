import ODA from "open-cloud-client";
import BimViewer from '../viewer/BimViewer';

/**
 * Extension of ODA Client for the BIM integration
 */
export default class BimClient extends ODA.Client {
  /**
   * Create instance of the `Viewer`.
   *
   * @async
   * @param {Object} params - An object containing `Viewer` configuration parameters.
   * @param {string} [params.visualizeJsUrl] - `VisualizeJS` library URL. Set this URL to use
   *   your own library instance or leave it blank to use the default URL defined by `Client.js`.
   * @param {HTMLCanvasElement} params.target - HTML `<canvas>` element for `VisualizeJS`.
   * @param {EventListener} [params.onprogress] - `VisualizeJS` library load progress callback
   *   function. Retrieves [visualizeprogress]{@link event:visualizeprogress} event to measure
   *   loading progress.
   * @returns {Promise<BimViewer>}
   */
   createViewer(params) {
    const viewer = new BimViewer(this, params);
    return viewer.initialize(params.target, params.onprogress);
  }
}