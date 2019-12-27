"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const supplement_1 = require("./supplement");
class Snippet {
    constructor(id = 0, title = '', index = '', timestamp = Date.now(), tags = '', supplements = [new supplement_1.Supplement()]) {
        this.id = String(id ? id : Math.floor(Math.random() * 1000000000) + 1);
        this.timestamp = timestamp;
        this.title = title;
        this.index = index;
        this.tags = tags;
        this.showing = true; //for search result
        this.pinned = false;
        this.supplements = supplements;
    }
    static createValidSnippet(snippet) {
        snippet.id = snippet.id || String(Math.floor(Math.random() * 1000000000) + 1);
        snippet.timestamp = snippet.timestamp || Date.now();
        snippet.title = snippet.title || '';
        snippet.index = snippet.index || '';
        snippet.tags = snippet.tags || '';
        snippet.showing = snippet.showing === true || snippet.showing === false ? snippet.showing : false;
        snippet.pinned = snippet.pinned === true || snippet.pinned === false ? snippet.pinned : false;
        snippet.supplements = snippet.supplements || [new supplement_1.Supplement()];
        return snippet;
    }
    static createValidSnippets(snippets) {
        return snippets.map(snippet => this.createValidSnippet(snippet));
    }
}
exports.Snippet = Snippet;
