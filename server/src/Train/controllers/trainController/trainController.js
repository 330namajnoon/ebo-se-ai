const { createController } = require("sm-express-server");
const Tasks = require("../../Tasks");
const TFModel = require("../../../models/TFModel");
const trainService = require("../../services/trainService");

const trainController = createController(async (req, res) => {
	const taskId = Tasks.add();
	const model = req.params.model;
	
	try {
		trainService(model, taskId);

		res.send({ taskId });
	} catch (error) {
		res.status(500).send({error: error.toString()});
	}
});

module.exports = trainController;
