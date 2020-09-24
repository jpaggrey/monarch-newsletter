import mongoose from 'mongoose';
import { Topic } from '../models/topic';
import { ServiceSchema } from 'moleculer';
import { Newsletter } from '../models/newsletter';
import dotenv from 'dotenv';
dotenv.config();

const NewsletterServiceSchema: ServiceSchema = {
	name: 'newsletters',
	version: 1,
	mixins: [],
	settings: {},
	actions: {
		create: {
			params: {
				year: {
					type: 'string',
					required: true,
				},
				month: {
					type: 'string',
					required: true,
				},
			},
			async handler(ctx) {
				// Query the DB for all Topics with published date for a given date(month, year)
				// Create a newsletter for the specific month example August 1, 2020
				const year = ctx.params.year;
				const month = ctx.params.month - 1;

				// Find if a newsletter have been already created for this month
				const existingNewsletter = await Newsletter.find({
					publishedDate: new Date(year, month, 1),
				});

				if (existingNewsletter.length > 0) {
					return { message: 'Newsletter already exists' };
				}

				// Query all posts with status "Review Complete"
				const topics = await Topic.find({
					status: 'Review Completed',
				});

				// Handle case where there no posts with status 'Review Complete'
				if (!topics) {
					return {
						message:
							'There are no topics to include in this newsletter',
					};
				}

				const newsletter = new Newsletter({
					publishedDate: new Date(year, month, 1),
					topics,
				});

				await newsletter.save();

				// Update the Topics with 'Review complete' to 'Published' and { published: false} to { published: true}
				await Topic.updateMany(
					{ status: 'Review Completed', published: false },
					{ status: 'Published', published: true }
				);

				return { newsletter };
			},
		},
		list: {
			rest: 'GET /',
			async handler() {
				const includeTopicFields = ['title', 'category', 'content'];
				const projection = {
					topics: 1,
					publishedDate: 1,
				};

				const newsletters = await Newsletter.find(
					{},
					projection
				).populate('topics', includeTopicFields);

				return { newsletters };
			},
		},
		current: {
			rest: 'GET /current',
			async handler() {
				const currentNewsletter = await Newsletter.find()
					.sort({
						publishedDate: -1,
					})
					.limit(1)
					.populate('topics');

				return { currentNewsletter };
			},
		},
		published: {
			params: {
				year: {
					type: 'string',
					optional: true,
				},
				month: {
					type: 'string',
					optional: true,
				},
			},
			async handler(ctx) {
				const { month, year } = ctx.params || undefined;

				let newsletters;
				if (month && !year) {
					newsletters = await Newsletter.aggregate([
						{
							$project: {
								topics: 1,
								month: { $month: '$publishedDate' },
							},
						},
						{ $match: { month: month * 1 } },
					]);
				} else if (!month && year) {
					newsletters = await Newsletter.aggregate([
						{
							$match: {
								publishedDate: {
									$gte: new Date(`${year * 1}-01-01`),
									$lte: new Date(`${year * 1}-12-31`),
								},
							},
						},
						{
							$sort: { publishedDate: -1 },
						},
					]);
				} else if (!month && !year) {
					newsletters = await Newsletter.find({});
				}
				await Topic.populate(newsletters, { path: 'topics' });

				return { newsletters };
			},
		},
		delete: {
			async handler() {
				await Newsletter.deleteMany({});

				return {};
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
			this.logger.info('Newsletter service started');
		});
	},
};

export = NewsletterServiceSchema;
