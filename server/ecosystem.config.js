module.exports = {
	apps: [
		{
			name: "ebo-se-ai",
			script: "index.js",
			watch: true,
			watch_ignore: ["node_modules", "public"],
			env: {
				NODE_ENV: "development",
				PORT: 4005,
			},
			env_production: {
				NODE_ENV: "production",
				PORT: 4005,
			},
		},
	],
};