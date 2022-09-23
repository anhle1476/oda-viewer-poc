import ODA from "open-cloud-client";
import IssueProvider from "../issues/IssueProvider";
import IssueDragger from "./dragger/IssueDragger";

/**
 * Extension of ODA viewer for the BIM integration
 */
export default class BimViewer extends ODA.Viewer {
	constructor(api, params = {}) {
		super(api, params);
		this.issueProvider = new IssueProvider();

		// Custom draggers
		this.draggerFactory.set("Issue", IssueDragger);
	}
}