const { createController } = require("sm-express-server");
const Tasks = require("../../Tasks");

const progressController = createController(async (req, res) => {

	try {
		const { taskId } = req.params;
		res.setHeader('Content-Type', 'text/event-stream');
		res.setHeader('Cache-Control', 'no-cache');
		res.flushHeaders();

		await Tasks.on(taskId, (progress) => {
			if (progress.value !== 100) {
				res.write(`data: ${JSON.stringify({ progress })}\n\n`);
				return true
			} else {
				return false;
			}
		}, 500)
	} catch (error) {
		res.write(`data: ${JSON.stringify({ error: error.toString() })}\n\n`);
	}

	res.write("event: end\n");
	res.write("data: done\n\n");
	res.end();
});

module.exports = progressController;
