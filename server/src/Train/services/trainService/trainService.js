const TFModel = require("../../../models/TFModel");
const tasks = require("../../Tasks");

const trainService = async (modelName = "model", taskId = "") => {
	const model = new TFModel(modelName);

	let value = 0;
	await model.loadDataset(({ imagePath, status, index, length }) => {
		value = ((50 / length) * index) + 20;
		tasks.set(taskId, { value, msg: "Loading data...", detail: { imagePath, status, index, length } })
	});
	await model.createModel();
	tasks.set(taskId, { value: 90, msg: "Model created!" });
	
	await model.train(({ epoch, loss, val_loss }) => {
		tasks.set(taskId, { value: 95, msg: "Training!", detail: { epoch, loss, val_loss } });
	});

	tasks.set(taskId, { value: 100, msg: "Loaded data!" });




	return model;
}

module.exports = trainService;
