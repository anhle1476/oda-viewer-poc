import BimBaseDragger from "./BimBaseDragger";
import * as KeyCode from "keycode-js";

export const ISSUE_PREFIX = "Issue_";
export const ISSUE_ENTITY_PREFIX =
	BimBaseDragger.OdConst.MARKUP_ENTITY_PREFIX + ISSUE_PREFIX;

export default class IssueDragger extends BimBaseDragger {
	constructor(...args) {
		super(...args);
		this.press = false;

		this.keydown = this.keydown.bind(this);
		this.keyup = this.keyup.bind(this);
	}

	initialize() {
		super.initialize();

		window.addEventListener("keydown", this.keydown, false);
		window.addEventListener("keyup", this.keyup, false);
	}

	dispose() {
		super.dispose();
		this.end();
		this.points = null;
		this.startCameraParams = null;

		window.removeEventListener("keydown", this.keydown, false);
		window.removeEventListener("keyup", this.keyup, false);
	}

	start(x, y) {
		this.entity = this._existingIssue(x, y);
		this.isOrbitOnly = this.isOrbit && !this.entity;

		if (!this.isOrbitOnly) {
			this._updateFrame(x, y);
		}
	}

	drag(x, y) {
		if (this.isDragging) {
			if (this.isOrbit) {
				this._orbit(x, y);
			}

			if (!this.isOrbitOnly) {
				this._updateFrame(x, y);
			}
		}
	}

	end() {
		this.point = null;
		this.entity = null;
		this.m_startPoint = null;
		this.isOrbitOnly = false;
	}

	_updateFrame(x, y) {
		this.point = this.getViewer().screenToWorld(x, y);
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

	// Orbit when hold space

	keydown(ev) {
		if (ev.code === KeyCode.CODE_SPACE) {
			this.press = true;

			this._registerStartCamera();
			this.beginInteractivity();
			this.isOrbit = true;
		}
	}

	keyup(ev) {
		if (ev.code === KeyCode.CODE_SPACE) {
			this.press = false;

			this.endInteractivity();
			this.startCameraParams = null;
			this.isOrbit = false;
			this.m_startPoint = null;
		}
	}

	_registerStartCamera() {
		const view = this.getViewer().activeView;

		this.startCameraParams = {
			position: view.viewPosition,
			target: view.viewTarget,
			upVector: view.upVector,
			viewFieldWidth: view.viewFieldWidth,
			viewFieldHeight: view.viewFieldHeight,
			perspective: view.perspective,
		};

		view.delete();
	}

	_orbit(x, y) {
		if (!this.m_startPoint) {
			this.m_viewCenter = this.getCenter();
			this.m_startPoint = { x: x, y: y };
		}

		const view = this.getViewer().activeView;

		const corners = view.vportRect;

		const size = Math.max(
			Math.abs(corners[2] - corners[0]),
			Math.abs(corners[3] - corners[1])
		);

		const xOrbit = ((this.m_startPoint.y - y) * Math.PI) / size;
		const yOrbit = ((this.m_startPoint.x - x) * Math.PI) / size;

		this.m_startPoint.x = x;
		this.m_startPoint.y = y;

		const viewParams = {
			position: view.viewPosition,
			target: view.viewTarget,
			upVector: view.upVector,
			viewFieldWidth: view.viewFieldWidth,
			viewFieldHeight: view.viewFieldHeight,
			perspective: view.perspective,
		};

		view.delete();

		const sideVector = this.getSideVector(viewParams);

		if (xOrbit !== 0.0) {
			this.calculateXOrbit(viewParams, -xOrbit, sideVector);
		}

		if (yOrbit !== 0.0) {
			this.calculateYOrbit(viewParams, yOrbit, sideVector);
		}

		sideVector.delete();

		const extView = this.getViewer().getActiveTvExtendedView();

		extView.setView(
			viewParams.position,
			viewParams.target,
			viewParams.upVector,
			viewParams.viewFieldWidth,
			viewParams.viewFieldHeight,
			viewParams.perspective
		);
		extView.delete();
	}

	getCenter() {
		const viewer = this.getViewer();

		let ext = viewer.getActiveExtents();

		const pSet = viewer.getSelected();
		if (!pSet.isNull() && pSet.numItems() !== 0) {
			const itr = pSet.getIterator();
			const entId = itr.getEntity();

			if (entId.getType() === 1) {
				const obj = entId.openObject();

				ext.delete();
				ext = obj.getExtents();

				obj.delete();
			} else if (entId.getType() === 2) {
				const obj = entId.openObjectAsInsert();
				const extTuple = obj.getExtents();

				ext.delete();
				ext = extTuple.ext;

				extTuple.delete();
				obj.delete();
			}

			itr.delete();
		}
		pSet.delete();

		const center = ext.center();

		ext.delete();
		return center;
	}

	calculateXOrbit(viewParams, delta, sideVector) {
		{
			const pPoint = this.toPoint(viewParams.position);
			const pCenter = this.toPoint(this.m_viewCenter);

			const rotatePoint = pPoint.rotateByBasePoint(delta, sideVector, pCenter);
			viewParams.position = rotatePoint.toArray();

			this.deleteAll([pPoint, pCenter, rotatePoint]);
		}

		{
			const pTarget = this.toPoint(viewParams.target);
			const pCenter = this.toPoint(this.m_viewCenter);

			const rotatePoint = pTarget.rotateByBasePoint(delta, sideVector, pCenter);
			viewParams.target = rotatePoint.toArray();

			this.deleteAll([pTarget, pCenter, rotatePoint]);
		}

		{
			const pPoint = this.toPoint(viewParams.position);
			const pTarget = this.toPoint(viewParams.target);
			const pCenter = this.toPoint(this.m_viewCenter);

			const pUp = pTarget.sub(pPoint);
			const vUp = pUp.asVector();

			const crossProduct = vUp.crossProduct(sideVector);
			const crossProductNormal = crossProduct.normalize();

			viewParams.upVector = crossProductNormal.toArray();

			this.deleteAll([
				pPoint,
				pTarget,
				pCenter,
				pUp,
				vUp,
				crossProduct,
				crossProductNormal,
			]);
		}
	}

	calculateYOrbit(viewParams, delta, sideVector) {
		{
			const pPoint = this.toPoint(viewParams.position);
			const pCenter = this.toPoint(this.m_viewCenter);

			const zAxis = this.toVector(this.m_module.Vector3d.kZAxis);

			const rotatePoint = pPoint.rotateByBasePoint(delta, zAxis, pCenter);
			viewParams.position = rotatePoint.toArray();

			this.deleteAll([zAxis, pPoint, pCenter, rotatePoint]);
		}

		{
			const pTarget = this.toPoint(viewParams.target);
			const pCenter = this.toPoint(this.m_viewCenter);

			const zAxis = this.toVector(this.m_module.Vector3d.kZAxis);

			const rotatePoint = pTarget.rotateByBasePoint(delta, zAxis, pCenter);
			viewParams.target = rotatePoint.toArray();

			this.deleteAll([zAxis, pTarget, pCenter, rotatePoint]);
		}

		{
			const zAxis = this.toVector(this.m_module.Vector3d.kZAxis);
			const pTarget = this.toPoint(viewParams.target);
			const pPoint = this.toPoint(viewParams.position);

			const side = sideVector.rotateBy(delta, zAxis);

			const pUp = pTarget.sub(pPoint);
			const vUp = pUp.asVector();

			const cross = vUp.crossProduct(side);
			const crossNormal = cross.normalize();

			viewParams.upVector = crossNormal.toArray();

			this.deleteAll([
				zAxis,
				pTarget,
				pPoint,
				side,
				pUp,
				vUp,
				cross,
				crossNormal,
			]);
		}
	}

	getSideVector(viewParams) {
		const pUpV = this.toVector(viewParams.upVector);
		const pTarget = this.toPoint(viewParams.target);
		const pPosition = this.toPoint(viewParams.position);

		const direct = pTarget.sub(pPosition);
		const vDirect = direct.asVector();

		const vCross = pUpV.crossProduct(vDirect);
		const sideVector = vCross.normalize();

		this.deleteAll([direct, pUpV, pTarget, pPosition, vDirect, vCross]);

		return sideVector;
	}
}
