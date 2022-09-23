import { OdBaseDragger } from "open-cloud-client/src/Viewer/Draggers/Common/OdBaseDragger";


/**
 * New base dragger for BIM application
 */
export default class BimBaseDragger extends OdBaseDragger {
	/**
	 * the non exposed constants used in OdBaseDragger and OdaGeAction
	 */
	static OdConst = {
		MARKUP_ENTITY_PREFIX: "$MarkupTempEntity_",
		CLICK_DELTA: 5,
	};
}