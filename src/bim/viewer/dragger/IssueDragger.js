import BimBaseDragger from "./BimBaseDragger";

export default class IssueDragger extends BimBaseDragger {
	// TODO: replace with issue provider
	static issues = [];

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

		const issue = this._existingIssue(x, y);
		console.log(issue);
	}

	drag(x, y) {
		if (this.isDragging) {
			this.point = this.getViewer().screenToWorld(x, y);
			this._updateFrame();
		}
	}

	end() {
		if (this.entity) {
			this.entity.delete();
			this.entity = null;
		}
	}

	_updateFrame() {
		if (this.entity) {
			const model = this.getViewer().getMarkupModel();
			model.removeEntity(this.entity);
			model.delete();
			this.entity.delete();
		}

		if (!this.point) return;

		this.entity = this.getActiveMarkupEntity("Issue");

		const entityPtr = this.entity.openObject();
		const issueGeoId = entityPtr.appendSphere(
			this.point,
			2,
			[0, 1, 0],
			[1, 0, 0]
		);

		IssueDragger.issues.push(issueGeoId);

		this.deleteAll([entityPtr]);
	}

	_existingIssue(x, y) {
		let existingIssue = null;

		const viewer = this.getViewer();

		if (viewer) {
			viewer.unselect();
			viewer.select(x, y, x, y);

			existingIssue = viewer.getSelected();

			const itr = existingIssue.getIterator();
			if (!itr.done()) {
				const entityId = itr.getEntity();
				let handle = -1;
				if (entityId.getType() === 1) {
					handle = entityId.openObject().getNativeDatabaseHandle();
				} else if (entityId.getType() === 2) {
					handle = entityId.openObjectAsInsert().getNativeDatabaseHandle();
				}
				console.log(handle);
			}
		}

		return existingIssue;
	}
}
