"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Topic = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
var TopicCategories;
(function (TopicCategories) {
    TopicCategories["MandatoryActionItems"] = "Mandatory Action Items";
    TopicCategories["ImportantInformation"] = "Important Information";
    TopicCategories["OtherAnnouncements"] = "Other Announcements";
    TopicCategories["BitsAndBytes"] = "Bits & Bytes For Thought";
})(TopicCategories || (TopicCategories = {}));
const topicSchema = new mongoose_1.default.Schema({
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
}, {
    toJSON: {
        transform(doc, ret) {
            delete ret.__v;
        },
    },
});
topicSchema.pre('save', function (next) {
    this.set('status', 'Awaiting Review');
    next();
});
const Topic = mongoose_1.default.model('Topic', topicSchema);
exports.Topic = Topic;
//# sourceMappingURL=topic.js.map