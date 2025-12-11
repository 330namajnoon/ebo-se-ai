const fs = require("fs");
const path = require("path");

class ModelsManeger {
	static get(model = "model-name") {
		try {
			const description = JSON.parse(fs.readFileSync(path.resolve("models", "description.json")));
			return description.find(d => d.name === model) || null;
		} catch (error) {
			throw error;
		}
	}
}

module.exports = ModelsManeger;
