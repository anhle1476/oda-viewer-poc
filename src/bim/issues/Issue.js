/**
 * The issue pointer with 3d location and display info
 */
export class IssuePointer {
	/**
	 *
	 * @param {OdTvEntity} entity
	 * @param {number[]} position
	 */
	constructor(entity, position = [0, 0, 0]) {
		this.entity = entity;
		this.updatePosition(position);
	}

	updatePosition(position) {
		if (!position || position.length !== 3) {
			throw new Error(
				`Invalid position ${position} - Should be an array with the length of 3`
			);
		}

		this.x = position[0];
		this.y = position[1];
		this.z = position[2];
	}

	getPosition() {
		return [this.x, this.y, this.z];
	}
}

/**
 * Store the current state of the viewer (hiding/isolate items, camera, ...etc...)
 */
export class ViewerState {}

export class IssueDetail {
	/**
	 * ctor
	 * @param {string} description
	 */
	constructor(description = "") {
		this.description = description;
	}
}

/**
 * Represent an issue on the model
 */
export default class Issue {
	/**
	 * ctor
	 * @param {string} name
	 * @param {IssuePointer} pointer
	 * @param {IssueDetail} detail
	 */
	constructor(name, pointer, detail) {
		this.name = name;
		this.point = pointer;
		this.detail = detail || new IssueDetail(`Issue name = ${this.name}`);
	}
}