const { createRouter } = require("sm-express-server");
const controllers = require("../controllers");

const router = createRouter("/train", (router) => {
	router.get("/progress/:taskId", controllers.progressController);

	router.post("/:model", controllers.trainController);
});

module.exports = router;
