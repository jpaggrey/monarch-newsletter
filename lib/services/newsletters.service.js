"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const mongoose_1 = __importDefault(require("mongoose"));
const topic_1 = require("../models/topic");
const newsletter_1 = require("../models/newsletter");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const NewsletterServiceSchema = {
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
            handler(ctx) {
                return __awaiter(this, void 0, void 0, function* () {
                    // Query the DB for all Topics with published date for a given date(month, year)
                    // Create a newsletter for the specific month example August 1, 2020
                    const year = ctx.params.year;
                    const month = ctx.params.month - 1;
                    // Find if a newsletter have been already created for this month
                    const existingNewsletter = yield newsletter_1.Newsletter.find({
                        publishedDate: new Date(year, month, 1),
                    });
                    if (existingNewsletter.length > 0) {
                        return { message: 'Newsletter already exists' };
                    }
                    // Query all posts with status "Review Complete"
                    const topics = yield topic_1.Topic.find({
                        status: 'Review Completed',
                    });
                    // Handle case where there no posts with status 'Review Complete'
                    if (!topics) {
                        return {
                            message: 'There are no topics to include in this newsletter',
                        };
                    }
                    const newsletter = new newsletter_1.Newsletter({
                        publishedDate: new Date(year, month, 1),
                        topics,
                    });
                    yield newsletter.save();
                    // Update the Topics with 'Review complete' to 'Published' and { published: false} to { published: true}
                    yield topic_1.Topic.updateMany({ status: 'Review Completed', published: false }, { status: 'Published', published: true });
                    return { newsletter };
                });
            },
        },
        list: {
            rest: 'GET /',
            handler() {
                return __awaiter(this, void 0, void 0, function* () {
                    const includeTopicFields = ['title', 'category', 'content'];
                    const projection = {
                        topics: 1,
                        publishedDate: 1,
                    };
                    const newsletters = yield newsletter_1.Newsletter.find({}, projection).populate('topics', includeTopicFields);
                    return { newsletters };
                });
            },
        },
        current: {
            rest: 'GET /current',
            handler() {
                return __awaiter(this, void 0, void 0, function* () {
                    const currentNewsletter = yield newsletter_1.Newsletter.find()
                        .sort({
                        publishedDate: -1,
                    })
                        .limit(1)
                        .populate('topics');
                    return { currentNewsletter };
                });
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
            handler(ctx) {
                return __awaiter(this, void 0, void 0, function* () {
                    const { month, year } = ctx.params || undefined;
                    let newsletters;
                    if (month && !year) {
                        newsletters = yield newsletter_1.Newsletter.aggregate([
                            {
                                $project: {
                                    topics: 1,
                                    month: { $month: '$publishedDate' },
                                },
                            },
                            { $match: { month: month * 1 } },
                        ]);
                    }
                    else if (!month && year) {
                        newsletters = yield newsletter_1.Newsletter.aggregate([
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
                    }
                    else if (!month && !year) {
                        newsletters = yield newsletter_1.Newsletter.find({});
                    }
                    yield topic_1.Topic.populate(newsletters, { path: 'topics' });
                    return { newsletters };
                });
            },
        },
        delete: {
            handler() {
                return __awaiter(this, void 0, void 0, function* () {
                    yield newsletter_1.Newsletter.deleteMany({});
                    return {};
                });
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
            mongoose_1.default
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
module.exports = NewsletterServiceSchema;
//# sourceMappingURL=newsletters.service.js.map