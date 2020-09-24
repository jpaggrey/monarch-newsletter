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
const NewsletterServiceSchema = {
    name: 'newsletter',
    version: 1,
    actions: {
        list: {
            rest: 'GET /newsletter',
            handler() {
                return __awaiter(this, void 0, void 0, function* () {
                    return 'Listing Newsletters';
                });
            },
        },
        newArticle: {
            rest: 'POST /new',
            params: {
                title: {
                    type: 'string',
                    optional: false,
                },
                category: {
                    type: 'string',
                    optional: false,
                },
                markdown: {
                    type: 'string',
                    optional: false,
                },
            },
            handler(ctx) {
                return __awaiter(this, void 0, void 0, function* () {
                    const { title, category, markdown } = ctx.params;
                    return { title, category, markdown };
                });
            },
        },
        updateArticle: {
            handler() {
                return __awaiter(this, void 0, void 0, function* () {
                    return 'Update Article';
                });
            },
        },
        deleteArticle: {
            handler() {
                return __awaiter(this, void 0, void 0, function* () {
                    return 'Delete Article';
                });
            },
        },
    },
};
module.exports = NewsletterServiceSchema;
//# sourceMappingURL=newsletter.service.js.map