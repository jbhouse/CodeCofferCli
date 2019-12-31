#!/usr/bin/env node
"use strict";
const exportUrl = 'https://jayman-gameserver.herokuapp.com/conversations/create';
const projectBaseDirectory = __dirname.split("\\implementations")[0];
const snippetBaseDirectory = '\\snippets\\';
const snippetsDirectory = projectBaseDirectory + snippetBaseDirectory;
const request = require('request')
const readline = require('readline');
const fs = require('fs');
const Snippet = require("../models/snippet").Snippet;
const userInput = process.argv.slice(2).join(" ");
const snippetsNames = fs.readdirSync(snippetsDirectory);
const userConfigFilePath = projectBaseDirectory + "\\" + "userConfig.json";
const userConfig = require(userConfigFilePath);
let snip;
if (userInput != "" && snippetsNames.filter(snippet => snippet == userInput).length === 1) {
    snip = createSnippetFromDirectory(userInput)
    exportSnippet(snip);
} else {
    snip = createSnippetFromList();
}

function createSnippetFromList() {
    let snippetList = [];

    for (let i = 0; i < snippetsNames.length; i++) {
        snippetList.push(i + ": " + snippetsNames[i]);
    }

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    rl.question("Select your snippet from the list\n" + snippetList.join("\n") + "\n", (answer) => {
        let snippetDirectory = snippetList.filter(snippetId => snippetId.split(":")[0] === answer)[0].split(":")[1].trim();
        let snippetChosenFromList = createSnippetFromDirectory(snippetDirectory);
        exportSnippet(snippetChosenFromList);
        rl.close();
    });
}

function createSnippetFromDirectory(directoryName) {
    let snippet = Snippet.createValidSnippet(JSON.parse(fs.readFileSync(snippetsDirectory + directoryName + "\\" + directoryName + ".json")));
    let supplements = fs.readdirSync(snippetsDirectory + directoryName).filter(fileName => fileName.split(".").slice(fileName.split(".").length - 1)[0] != 'json');

    supplements.forEach(supplementName => {
        let snippetSupplement = snippet.supplements.filter(supplement => supplement.name + "." + supplement.language === supplementName)[0];
        let content = fs.readFileSync(snippetsDirectory + directoryName + "\\" + supplementName).toString();
        snippetSupplement.code = content;
    });

    let filePath = snippetsDirectory + snippet.title + '\\' + snippet.title + ".json";
    fs.writeFileSync(filePath, JSON.stringify(snippet, null, 2));

    if (userConfig.openSnippetBeforeExporting) {
        require('child_process').exec(userConfig.defaultEditor + " " + filePath);
    }
    return snippet;
}

function exportSnippet(snippet) {
    request.post(exportUrl, {
        json: {
            message: {
                content: snippet
            }
        }
    }, (error, res, body) => {
        if (error) {
            console.error(error)
            return
        }
        if (res.statusCode === 200) {            
            console.log('https://jayckers.com/snippet/en/#/import/' + body.conversationId);
        } else {
            console.log(`statusCode: ${res.statusCode}`)
        }
    })
}