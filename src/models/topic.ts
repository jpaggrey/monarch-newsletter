import mongoose from 'mongoose';

enum TopicCategories {
	MandatoryActionItems = 'Mandatory Action Items',
	ImportantInformation = 'Important Information',
	OtherAnnouncements = 'Other Announcements',
	BitsAndBytes = 'Bits & Bytes For Thought',
}

interface ITopicModel extends mongoose.Model<ITopicDoc> {}

export interface ITopicDoc extends mongoose.Document {
	title: string;
	category: TopicCategories;
	markdown: string;
	createdAt: Date;
	updatedAt: Date;
	status: string;
	published: boolean;
	imageURL?: string;
}

const topicSchema = new mongoose.Schema(
	{
		title: {
			type: String,
			trim: true,
			required: true,
		},
		category: {
			type: String,
			required: true,
			enum: {
				values: [
					'Mandatory Action Items',
					'Important Information',
					'Other Announcements',
					'Bits and Bytes',
				],
				message: '',
			},
		},
		content: {
			type: String,
			required: true,
		},
		createdAt: {
			type: Date,
			default: Date.now(),
		},
		updatedAt: {
			type: Date,
			default: null,
		},
		status: {
			type: String,
			enum: {
				values: ['Awaiting Review', 'Review Completed', 'Published'],
			},
		},
		published: {
			type: Boolean,
			default: false,
		},
	},
	{
		toJSON: {
			transform(doc, ret) {
				delete ret.__v;
			},
		},
	}
);

topicSchema.pre('save', function (next) {
	this.set('status', 'Awaiting Review');
	next();
});

const Topic = mongoose.model<ITopicDoc, ITopicModel>('Topic', topicSchema);

export { Topic };
