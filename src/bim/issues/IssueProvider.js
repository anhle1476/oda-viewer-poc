/**
 * POC issue provider (in memory)
 *
 * TODO: replace with server call on production
 */
export default class IssueProvider {
	constructor() {
		this.m_issues = new Map();
	}

	/**
	 * Store new issue
	 * @param {Issue} issue
	 */
	set(issue) {
		const issueName = issue.name;
		if (!issueName) throw new Error("Can not process issue without name");

		this.m_issues.set(issueName, issue);
	}

	get(issueName) {
		return this.m_issues.get(issueName);
	}

	getAll() {
		return [...this.m_issues.values()];
	}

	has(issueName) {
		return this.m_issues.has(issueName);
	}

	delete(issueName) {
		return this.m_issues.delete(issueName);
	}
}
