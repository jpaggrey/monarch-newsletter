import { ServiceSchema } from 'moleculer';
import mongoose from 'mongoose';
import AWS from 'aws-sdk';
import { uuid } from 'uuidv4';
import { APIFeatures } from '../utils/api-features';
import { Topic } from '../models/topic';
import dotenv from 'dotenv';
dotenv.config({ path: '../../example.env' });

interface ITopic {
	title: string;
	category: string;
	content: string;
	published: boolean;
}

const s3 = new AWS.S3();

const TopicsServiceSchema: ServiceSchema = {
	name: 'topics',
	version: 1,
	model: Topic,
	meta: {},
	settings: {},
	actions: {
		list: {
			rest: 'GET /',
			async handler(ctx) {
				const features = new APIFeatures(Topic.find(), ctx.params)
					.filter()
					.sort()
					.limitFields()
					.paginate();
				const topics = await features.query;
				return { topics };
			},
		},
		create: {
			rest: 'POST /',
			params: {
				title: {
					type: 'string',
					optional: false,
				},
				category: {
					type: 'string',
					optional: false,
				},
				content: {
					type: 'string',
					optional: false,
				},
				published: {
					type: 'boolean',
					optional: true,
				},
			},
			async handler(ctx) {
				const {
					title,
					category,
					content,
					published,
				}: ITopic = ctx.params;
				const topic = new Topic({
					title,
					category,
					content,
					published,
				});
				await topic.save();
				return { topic };
			},
		},
		show: {
			rest: 'GET /:id',
			params: {
				id: {
					type: 'string',
					optional: false,
				},
			},
			async handler(ctx) {
				const { id } = ctx.params;
				const topic = await Topic.findById(id);

				if (!topic) {
					throw new Error('Topic not found.');
				}

				return { topic };
			},
		},
		update: {
			rest: 'PATCH /:id',
			params: {
				id: {
					type: 'string',
					optional: false,
				},
				title: {
					type: 'string',
					optional: true,
				},
				category: {
					type: 'string',
					optional: true,
				},
				content: {
					type: 'string',
					optional: true,
				},
			},
			async handler(ctx) {
				const { id } = ctx.params;
				const updatedTopic = await Topic.findByIdAndUpdate(
					id,
					{
						...ctx.params,
						updatedAt: Date.now(),
					},
					{
						new: true,
						runValidators: true,
					}
				);

				if (!updatedTopic) {
					throw new Error('Topic not found.');
				}

				return { updatedTopic };
			},
		},
		delete: {
			rest: 'DELETE /:id',
			params: {
				id: {
					type: 'string',
					optional: false,
				},
			},
			async handler(ctx) {
				const { id } = ctx.params;
				await Topic.findByIdAndDelete(id);
				return {};
			},
		},
		upload: {
			params: {
				filetype: {
					type: 'string',
					optional: false,
				},
			},
			rest: 'GET /upload',
			handler(ctx) {
				const { fileType } = ctx.params;
				const fileExt = fileType.substring(fileType.indexOf('/') + 1);
				const key = `newsletter/${uuid()}.${fileExt}`;
				s3.getSignedUrl(
					'putObject',
					{
						Bucket: 'monarch-newsletter',
						ContentType: fileType,
						ACL: 'public-read',
						Key: key,
					},
					(err, url) => {
						if (err) {
							this.logger.warn(err);
						}

						return { key, url };
					}
				);
			},
		},
		review: {
			params: {
				id: {
					type: 'string',
					optional: false,
				},
			},
			async handler(ctx) {
				const { id } = ctx.params;
				const topic = await Topic.findById(id);

				if (!topic) {
					throw new Error('Topic not found');
				}

				topic.set({
					status: 'Review Completed',
				});

				await topic.save();

				return { topic };
			},
		},
		// TODO - delete action
		reviewAllTopics: {
			rest: 'POST /review-topics',
			async handler() {
				await Topic.updateMany(
					{ status: 'Awaiting Review' },
					{ status: 'Review Completed' }
				);

				return 'Changed topics';
			},
		},
		// TODO - delete action
		deleteAllTopics: {
			async handler() {
				await Topic.deleteMany({});

				return { message: 'All topics deleted in the DB' };
			},
		},
	},
	created() {
		return Promise.resolve()
			.then(() => {
				this.logger.info('Initializing DB');

				const DB = process.env.MONGO_URI;

				if (!DB) {
					this.logger.warn('Mongo URI must be defined.');
					return;
				}

				mongoose
					.connect(DB, {
						useNewUrlParser: true,
						useUnifiedTopology: true,
						useCreateIndex: true,
						useFindAndModify: false,
					})
					.then(() => {
						this.logger.info('Connected to DB');
					});
			})
			.catch((err) => {
				this.logger.warn('Connection failed.', err);
			});
	},
	started() {
		return Promise.resolve().then(() => {
			this.logger.info('Topics service initialized');
		});
	},
};

export = TopicsServiceSchema;
