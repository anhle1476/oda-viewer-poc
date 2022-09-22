/**
 * The issue pointer with 3d location and display info
 */
export class IssuePointer {
  constructor(pointer, color) {
    this.pointer = pointer;
    this.color = color;
  }
}

/**
 * Store the current state of the viewer (hiding/isolate items, camera, ...etc...)
 */
export class ViewerState {

}

export class IssueDetail {

}

/**
 * Represent an issue on the model
 */
export default class Issue {
  /**
   * ctor
   * @param {number} id 
   * @param {IssuePointer} point 
   * @param {IssueDetail} detail 
   */
  constructor(id, point, detail) {
    this.id = id;
    this.point = point;
    this.detail = detail
  }
}