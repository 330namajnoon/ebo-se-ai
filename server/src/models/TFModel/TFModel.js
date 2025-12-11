const ModelsManeger = require("../ModelsManeger");
const tf = require("@tensorflow/tfjs-node");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");
const fs = require("fs");

class TFModel {
	constructor({ model = "model-test", shouldContinueTraining = false, width = 120, height = 120, patience = 6 }) {
		this.shouldContinueTraining = shouldContinueTraining;
		this.modelDescription = ModelsManeger.get(model);
		this.width = width;
		this.height = height;
		this.model = null;
		this.labels = [];
		this.data = [];
		this.patience = patience;
		this.events = [];
	}

	getLabels() {
		return fs.readdirSync(path.resolve("dataset", "images"));
	}

	async getPixels(imagePath) {
		try {
			const img = await loadImage(imagePath);
			const canvas = createCanvas(this.width, this.height);
			const ctx = canvas.getContext("2d");

			ctx.drawImage(img, 0, 0, img.width, img.height, -((this.width - ((this.height / img.height * img.width) - this.width)) / 2), 0, this.height / img.height * img.width, this.height);

			const imgData = ctx.getImageData(0, 0, this.width, this.height);
			const pixels = [];
			for (let y = 0; y < this.height; y++) {
				let row = [];
				for (let x = 0; x < this.width; x++) {
					const idx = (y * this.width + x) * 4;

					row.push([
						(imgData.data[idx] / 127.5) - 1,
						(imgData.data[idx + 1] / 127.5) - 1,
						(imgData.data[idx + 2] / 127.5) - 1
					]);
				}
				pixels.push(row);
			}

			return pixels;
		} catch (error) {
			throw error;
		}
	}

	getTensors() {
		const xsArray = this.data.map(d => d.input);
		const ysArray = this.data.map(d => d.label);

		const xs = tf.tensor4d(xsArray, [xsArray.length, this.height, this.width, 3]);
		const ys = tf.oneHot(tf.tensor1d(ysArray, 'int32'), this.labels.length);

		return { xs, ys };
	}

	async loadDataset(callback = ({ imagePath = "", status = "loaded", index = 0, length = 100 }) => { }) {
		this.labels = this.getLabels();
		let index = 0;
		let data = this.labels.map(label => {
			const folder = path.resolve("dataset", "images", label);
			const images = fs.readdirSync(folder);
			return images.map(imgName => {
				return { imagePath: path.join(folder, imgName), label };
			});
		}).flat();
		const length = data.length;
		for (const { imagePath, label } of data) {
			try {
				const pixels = await this.getPixels(imagePath);
				callback({ imagePath, status: "loaded", index, length });
				const augmented = this.flipHorizontal(pixels);   // flip
				const rotated = this.rotate90(pixels);
				const brighter = this.adjustBrightness(pixels, 0.1); // brillo
				this.data.push({
					input: pixels,
					label: this.labels.indexOf(label),
				});
				this.data.push({
					input: augmented,
					label: this.labels.indexOf(label),
				});
				this.data.push({
					input: rotated,
					label: this.labels.indexOf(label),
				});
				this.data.push({
					input: brighter,
					label: this.labels.indexOf(label),
				});
				index++;
			} catch (e) {
				console.log("Imagen dañada ignorada:", imagePath);
			}
		}
		this.shuffleData(this.data);
		this.shuffleData(this.data);
		this.shuffleData(this.data);
		return this;
	}

	async prepareModel() {
		if (this.modelDescription && this.shouldContinueTraining) {
			await this.loadModel();
		} else {
			await this.createModel();
		}
	}

	async createModel() {
		this.model = tf.sequential();

		this.model.add(tf.layers.conv2d({
			inputShape: [this.height, this.width, 3],
			filters: 16,
			kernelSize: 3,
			activation: "relu",
		}));
		this.model.add(tf.layers.maxPool2d({
			poolSize: 2,
		}));

		this.model.add(tf.layers.conv2d({
			filters: 32,
			kernelSize: 3,
			activation: "relu",
		}));
		this.model.add(tf.layers.maxPool2d({
			poolSize: 2,
		}));

		this.model.add(tf.layers.flatten());
		this.model.add(tf.layers.dropout({ rate: 0.3 }));

		this.model.add(tf.layers.dense({
			units: 64,
			activation: "relu"
		}));

		this.model.add(tf.layers.dense({
			units: this.labels.length,
			activation: "softmax",
		}));

		this.model.compile({
			optimizer: tf.train.adam(0.001),
			loss: "categoricalCrossentropy",
			metrics: ["accuracy"]
		});

		return this;
	}

	async loadModel() {
		const modelPath = `file://${path.join(this.modelDescription.path)}`;
		this.model = await tf.loadLayersModel(modelPath);

	}

	async train(callback = ({ loss = 0, val_loss = 0, epoch = 0 }) => { }) {
		let stopTraining = false;
		let bestValLoss = Infinity;
		let patienceCounter = 0;
		const { xs, ys } = this.getTensors();
		return await this.model.fit(xs, ys, {
			epochs: 99999,
			shuffle: true,
			batchSize: 16,
			validationSplit: 0.2,
			verbose: 0,   // desactiva el ProgbarLogger
			callbacks: {
				onEpochEnd: async (epoch, logs) => {
					console.log(`Epoch ${epoch} - loss: ${logs.loss} - val_loss: ${logs.val_loss}`);

					callback({ epoch, loss: logs.loss, val_loss: logs.val_loss });

					if (logs.val_loss < bestValLoss) {
						bestValLoss = logs.val_loss;
						patienceCounter = 0;
					} else {
						patienceCounter++;
					}

					if (patienceCounter >= this.patience) {
						console.log(`⏹ Early stopping en epoch ${epoch}, val_loss: ${logs.val_loss}`);
						this.model.stopTraining = true;
					}

					if (stopTraining) {
						this.model.stopTraining = true;   // detener training
					}
				}
			}
		});
	}

	shuffleData(data) {
		for (let i = data.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[data[i], data[j]] = [data[j], data[i]];
		}
	}

	flipHorizontal(pixels) {
		const height = pixels.length;
		const width = pixels[0].length;
		const flipped = [];
		for (let y = 0; y < height; y++) {
			flipped.push([...pixels[y]].reverse());
		}
		return flipped;
	}

	rotate90(pixels) {
		const height = pixels.length;
		const width = pixels[0].length;
		const rotated = [];
		for (let x = 0; x < width; x++) {
			const row = [];
			for (let y = height - 1; y >= 0; y--) {
				row.push(pixels[y][x]);
			}
			rotated.push(row);
		}
		return rotated;
	}

	adjustBrightness(pixels, factor) {
		return pixels.map(row => row.map(([r, g, b]) => [
			Math.min(Math.max(r + factor, 0), 1),
			Math.min(Math.max(g + factor, 0), 1),
			Math.min(Math.max(b + factor, 0), 1),
		]));
	}
}

module.exports = TFModel;
