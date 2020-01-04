"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const language_enum_1 = require("./language.enum");
class Supplement {
    constructor(name = '', code = '', notes = '', language = language_enum_1.Language.TEXT) {
        this.name = name;
        this.language = language;
        this.code = code;
        this.notes = notes;
    }
}
exports.Supplement = Supplement;
