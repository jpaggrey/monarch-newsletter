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
const aws_sdk_1 = __importDefault(require("aws-sdk"));
const uuidv4_1 = require("uuidv4");
const api_features_1 = require("../utils/api-features");
const topic_1 = require("../models/topic");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ path: '../../example.env' });
const s3 = new aws_sdk_1.default.S3();
const TopicsServiceSchema = {
    name: 'topics',
    version: 1,
    model: topic_1.Topic,
    meta: {},
    settings: {},
    actions: {
        list: {
            rest: 'GET /',
            handler(ctx) {
                return __awaiter(this, void 0, void 0, function* () {
                    const features = new api_features_1.APIFeatures(topic_1.Topic.find(), ctx.params)
                        .filter()
                        .sort()
                        .limitFields()
                        .paginate();
                    const topics = yield features.query;
                    return { topics };
                });
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
            handler(ctx) {
                return __awaiter(this, void 0, void 0, function* () {
                    const { title, category, content, published, } = ctx.params;
                    const topic = new topic_1.Topic({
                        title,
                        category,
                        content,
                        published,
                    });
                    yield topic.save();
                    return { topic };
                });
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
            handler(ctx) {
                return __awaiter(this, void 0, void 0, function* () {
                    const { id } = ctx.params;
                    const topic = yield topic_1.Topic.findById(id);
                    if (!topic) {
                        throw new Error('Topic not found.');
                    }
                    return { topic };
                });
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
            handler(ctx) {
                return __awaiter(this, void 0, void 0, function* () {
                    const { id } = ctx.params;
                    const updatedTopic = yield topic_1.Topic.findByIdAndUpdate(id, Object.assign(Object.assign({}, ctx.params), { updatedAt: Date.now() }), {
                        new: true,
                        runValidators: true,
                    });
                    if (!updatedTopic) {
                        throw new Error('Topic not found.');
                    }
                    return { updatedTopic };
                });
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
            handler(ctx) {
                return __awaiter(this, void 0, void 0, function* () {
                    const { id } = ctx.params;
                    yield topic_1.Topic.findByIdAndDelete(id);
                    return {};
                });
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
                const key = `newsletter/${uuidv4_1.uuid()}.${fileExt}`;
                s3.getSignedUrl('putObject', {
                    Bucket: 'monarch-newsletter',
                    ContentType: fileType,
                    ACL: 'public-read',
                    Key: key,
                }, (err, url) => {
                    if (err) {
                        this.logger.warn(err);
                    }
                    return { key, url };
                });
            },
        },
        review: {
            params: {
                id: {
                    type: 'string',
                    optional: false,
                },
            },
            handler(ctx) {
                return __awaiter(this, void 0, void 0, function* () {
                    const { id } = ctx.params;
                    const topic = yield topic_1.Topic.findById(id);
                    if (!topic) {
                        throw new Error('Topic not found');
                    }
                    topic.set({
                        status: 'Review Completed',
                    });
                    yield topic.save();
                    return { topic };
                });
            },
        },
        reviewAllTopics: {
            rest: 'POST /review-topics',
            handler() {
                return __awaiter(this, void 0, void 0, function* () {
                    yield topic_1.Topic.updateMany({ status: 'Awaiting Review' }, { status: 'Review Completed' });
                    return 'Changed topics';
                });
            },
        },
        deleteAllTopics: {
            handler() {
                return __awaiter(this, void 0, void 0, function* () {
                    yield topic_1.Topic.deleteMany({});
                    return { message: 'All topics deleted in the DB' };
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
            this.logger.info('Topics service initialized');
        });
    },
};
module.exports = TopicsServiceSchema;
//# sourceMappingURL=topics.service.js.map