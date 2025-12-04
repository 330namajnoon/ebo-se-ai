module.exports = {
	apps: [
		{
			name: "ebo-se-ai",
			script: "server/index.js",
			watch: true,
			watch_ignore: ["server/node_modules", "server/public"],
			env: {
				NODE_ENV: "development",
				PORT: 5000,
			},
			env_production: {
				NODE_ENV: "production",
				PORT: 5000,
			},
		},
	],
};