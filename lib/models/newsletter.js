"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Newsletter = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const newsletterSchema = new mongoose_1.default.Schema({
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
            type: mongoose_1.default.Schema.Types.ObjectId,
            ref: 'Topic',
        },
    ],
}, {
    toJSON: {
        transform(doc, ret) {
            delete ret.__v;
        },
    },
});
const Newsletter = mongoose_1.default.model('Newsletter', newsletterSchema);
exports.Newsletter = Newsletter;
//# sourceMappingURL=newsletter.js.map