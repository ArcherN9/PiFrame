class Node {

	constructor() {
		this.data = null;
		this.next = null;
	}

	set(newItem) {
		this.data = newItem;
	}
}

//Export to module to make it available globally
module.exports = Node; 