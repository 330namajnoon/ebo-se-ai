
class TasksManeger {
	constructor() {
		this.tasks = new Map();
		this.events = [];
	}

	add() {
		const taskId = Date.now().toString();
		this.tasks.set(taskId, { value: 0, msg: "-" });
		return taskId;
	}

	get(taskId) {
		return this.tasks.get(taskId);
	}

	set(taskId, { value = 0, msg = "-", detail }) {
		this.tasks.set(taskId, { value, msg, detail });
		return this.tasks.get(taskId);
	}

	on(taskId = null, callback = () => false, time = 500) {
		return new Promise((resolve, reject) => {
			const task = this.get(taskId)
			if (task) {
				const cont = callback(task);
				if (cont) {
					setTimeout(() => {
						this.on(taskId, callback, time).then(resolve);
					}, time)
				} else {
					resolve(task);
				}
			} else {
				reject(new Error("task not found!"));
			}
		})
	}
}

module.exports = TasksManeger;
