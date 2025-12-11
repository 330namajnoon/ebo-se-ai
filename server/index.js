const { Server } = require("sm-express-server");
const path = require("path");
const express = require("express");

const { router: trainRouter } = require("./src/Train");

const server = new Server(process.env.PORT || 5000, path.join(__dirname, "public"), [express.json()], [trainRouter]);

server.start(() => {
	console.log(`Server is running on port ${server.port}`);
});
