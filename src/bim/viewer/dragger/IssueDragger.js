import BimBaseDragger from "./BimBaseDragger";

export const ISSUE_PREFIX = "Issue_";
export const ISSUE_ENTITY_PREFIX =
	BimBaseDragger.OdConst.MARKUP_ENTITY_PREFIX + ISSUE_PREFIX;

export default class IssueDragger extends BimBaseDragger {
	constructor(...args) {
		super(...args);
		this.press = false;
	}

	dispose() {
		super.dispose();
		this.end();
		this.points = null;
	}

	start(x, y) {
		this.point = this.getViewer().screenToWorld(x, y);
		this.entity = this._existingIssue(x, y);
		this._updateFrame();
	}

	drag(x, y) {
		if (this.isDragging) {
			this.point = this.getViewer().screenToWorld(x, y);
			this._updateFrame();
		}
	}

	end() {
		this.point = null;
		this.entity = null;
	}

	_updateFrame() {
		if (!this.point) return;

		if (!this.entity) {
			this.entity = this.getActiveMarkupEntity(
				ISSUE_PREFIX + crypto.randomUUID()
			);
		}

		const entityPtr = this.entity.openObject();

		const geometryItr = entityPtr.getGeometryDataIterator();

		if (!geometryItr.done()) {
			// have an existing geometry
			const sphereData = geometryItr.getGeometryData().openAsSphere();
			sphereData.setCenter(this.point);
		} else {
			entityPtr.appendSphere(this.point, 2, [0, 1, 0], [1, 0, 0]);
		}
	}

	_existingIssue(x, y) {
		let existingIssue = undefined;

		const viewer = this.getViewer();

		if (viewer) {
			viewer.unselect();
			viewer.select(x, y, x, y);

			const selectSet = viewer.getSelected();

			const itr = selectSet.getIterator();
			if (!itr.done()) {
				const entityId = itr.getEntity();
				console.log("entity", entityId);

				const selectedEntity = entityId.openObject();
				const issueName = this._getIssueNameFromEntityName(
					selectedEntity.getName()
				);
				if (!issueName) {
					// not an issue -> revert the selection
					viewer.unselect();
				} else {
					existingIssue = entityId;
				}
			}
		}

		return existingIssue;
	}

	_getIssueProvider() {
		return this.subject.issueProvider; // subject is the BimViewer;
	}

	_getEntityNameByIssueName(issueName) {
		return BimBaseDragger.OdConst.MARKUP_ENTITY_PREFIX + issueName;
	}

	_getIssueNameFromEntityName(entityName = "") {
		if (!entityName.startsWith(ISSUE_ENTITY_PREFIX)) return "";

		return entityName.substring(
			BimBaseDragger.OdConst.MARKUP_ENTITY_PREFIX.length
		);
	}
}
