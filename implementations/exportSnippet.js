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
const openSnippetBeforeExporting = (rl2) => {
    return new Promise((resolve, reject) => {
        rl2.question("", (answer) => {
            resolve();
        });
    });
};
const openSnippetsFromList = (rl, snippetList) => {
    return new Promise((resolve, reject) => {
        rl.question("Select your snippet from the list\n" + snippetList.join("\n") + "\n", (answer) => {
            let snippetDirectory = snippetList.filter(snippetId => snippetId.split(":")[0] === answer)[0].split(":")[1].trim();
            resolve(snippetDirectory);
        });
    });
}

async function createSnippetFromList() {
    let snippetList = [];

    for (let i = 0; i < snippetsNames.length; i++) {
        snippetList.push(i + ": " + snippetsNames[i]);
    }

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    let snippetChosenFromList = await openSnippetsFromList(rl, snippetList);
    let snippetToExport = await createSnippetFromDirectory(snippetChosenFromList);

    rl.close();
    exportSnippet(snippetToExport);
}

async function createSnippetFromDirectory(directoryName) {
    let filePath = snippetsDirectory + directoryName + "\\" + directoryName + ".json";
    let snippet = Snippet.createValidSnippet(JSON.parse(fs.readFileSync(filePath)));

    let supplements = fs.readdirSync(snippetsDirectory + directoryName).filter(fileName => fileName.split(".").slice(fileName.split(".").length - 1)[0] != 'json');

    supplements.forEach(supplementName => {
        let snippetSupplement = snippet.supplements.filter(supplement => supplement.name + "." + supplement.language === supplementName)[0];
        let content = fs.readFileSync(snippetsDirectory + directoryName + "\\" + supplementName).toString();
        snippetSupplement.code = content;
    });

    fs.writeFileSync(filePath, JSON.stringify(snippet, null, 2));

    if (userConfig.openSnippetBeforeExporting) {
        const rl2 = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        console.log("\nOpening snippet for editing. Press enter when you are ready to export the snippet.");
        require('child_process').exec(userConfig.defaultEditor + ' "' + filePath +'"');
        await openSnippetBeforeExporting(rl2);
        // need to reflect changes made to the snippet in the existing file/folder names
        rl2.close();
        snippet = Snippet.createValidSnippet(JSON.parse(fs.readFileSync(filePath)));
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

(async function(){
    let snip;
    if (userInput != "" && snippetsNames.filter(snippet => snippet == userInput).length === 1) {
        snip = await createSnippetFromDirectory(userInput)
        exportSnippet(snip);
    } else {
        snip = await createSnippetFromList();
    }
})();