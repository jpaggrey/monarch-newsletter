import mongoose from 'mongoose';

interface INewsletterModel extends mongoose.Model<INewsletterDoc> {}

interface INewsletterDoc extends mongoose.Document {
	publishedDate: Date;
	posts: [];
	published: boolean;
}

const newsletterSchema = new mongoose.Schema(
	{
		publishedDate: {
			type: Date,
			trim: true,
			required: true,
		},
		published: {
			type: Boolean,
			value: false,
		},
		topics: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: 'Topic',
			},
		],
	},
	{
		toJSON: {
			transform(doc, ret) {
				delete ret.__v;
			},
		},
	}
);

const Newsletter = mongoose.model<INewsletterDoc, INewsletterModel>(
	'Newsletter',
	newsletterSchema
);

export { Newsletter };
