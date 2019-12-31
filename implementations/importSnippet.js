#!/usr/bin/env node
"use strict";
const projectBaseDirectory = __dirname.split("\\implementations")[0];
const snippetBaseDirectory = '\\snippets\\';
const userConfigFilePath = projectBaseDirectory + "\\" + "userConfig.json";
const userConfiguration = require(userConfigFilePath);
const browserOpener = require('opn');
const snippet_1 = require("../models/snippet");
const clipboardy = require('clipboardy');
const baseUrl = 'https://jayckers.com/snippet/en/#/import/';
const readline = require('readline');
const https = require('https');
const fs = require('fs');

function openFileInEditor(snippet) {
    let filePaths = transformSupplementNamesToFilePaths(snippet).join(" ");
    require('child_process').exec(userConfiguration.defaultEditor + " " + filePaths);
}
function openFileInBrowser(snippetId) {
    return () => browserOpener(baseUrl + snippetId);
}
function transformSupplementNamesToFilePaths(snippet) {
    const snippetDirectory = projectBaseDirectory + snippetBaseDirectory + snippet.title;
    return snippet.supplements
        .map(supplement => supplement.name + '.' + supplement.language)
        .map(fileName => '"' + snippetDirectory + "\\" + fileName + '"');
}
function saveFile() {
    return (snippet) => {
        let snippetDirectory = projectBaseDirectory + snippetBaseDirectory + snippet.title;
        if (!fs.existsSync(snippetDirectory)) {
            fs.mkdirSync(snippetDirectory, { recursive: true });
            fs.writeFileSync(snippetDirectory + "\\" + snippet.title + ".json", JSON.stringify(snippet, null, 2));
            snippet.supplements.forEach(supplement => {
                let fileName = supplement.name + '.' + supplement.language;
                fs.writeFileSync(snippetDirectory + "\\" + fileName, supplement.code);
            });
        }
        else {
            fs.readdirSync(snippetDirectory).forEach((file) => {
                fs.readFile(snippetDirectory + "\\" + file, 'utf8', function (err, contents) {
                    let incomingSnippetContents = snippet.supplements.filter(supplement => supplement.name + '.' + supplement.language === file)[0].code;
                    if (contents != incomingSnippetContents) {
                        const rl = readline.createInterface({
                            input: process.stdin,
                            output: process.stdout
                        });
                        rl.question("'" + file + "' already exists and differs from snippet being imported. Replace the existing snippet? (Y/N): ", (answer) => {
                            if (answer.toLocaleLowerCase() == 'y' || answer.toLocaleLowerCase() == 'yes') {
                                fs.writeFileSync(snippetDirectory + "\\" + file, incomingSnippetContents);
                            }
                            rl.close();
                        });
                    }
                });
            });
        }
    };
}
function saveContentToClipboard(snippet) {
    clipboardy.writeSync(snippet.supplements.map(supplement => supplement.code).join("\n"));
}
function getSnippet(url, callbacks) {
    https.get(url, (resp) => {
        let data = '';
        resp.on('data', (chunk) => {
            data += chunk;
        });
        resp.on('end', () => {
            const snip = snippet_1.Snippet.createValidSnippet(JSON.parse(data)[0].message.content);
            callbacks.forEach(callback => {
                callback(snip);
            });
        });
    }).on("error", (err) => {
        console.log("Error: " + err.message);
    });
}
(function openSnippetFromUrl(userInput, fs) {
    const id = userInput.split("import/")[1];
    const url = "https://jayman-gameserver.herokuapp.com/conversations/" + id + "?startingIndex=0";
    let callbacks = [saveFile()];
    if (userConfiguration.openFilesOnImport) {
        callbacks.push(openFileInEditor);
    } else {
        callbacks.push(openFileInBrowser(id));
    }
    if (userConfiguration.copyContentsToClipBoard) {
        callbacks.push(saveContentToClipboard);
    }
    getSnippet(url, callbacks);
})(process.argv.slice(2).join(" "))
