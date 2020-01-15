const exportUrl =
    "https://jayman-gameserver.herokuapp.com/conversations/create";
const request = require("request");
const fs = require('fs');
const readline = require('readline');
const clipboardy = require('clipboardy');
const Snippet = require("../models/snippet").Snippet;

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
const promptForTitle = () => {
    return new Promise((resolve, reject) => {
        rl.question("\nPlease provide a title for this snippet: ", (answer = '') => {
            resolve(answer);
        });
    });
};
const promptForTags = () => {
    return new Promise((resolve, reject) => {
        rl.question("\nWould you like to add a tag to this snippet?: ", (answer = '') => {
            resolve(answer);
        });
    });
};
const checkForNote = title => {
    return new Promise((resolve, reject) => {
        rl.question("\nEnter a note for the snippet supplement " + title + " : ", (answer = '') => {
            resolve(answer);
        });
    });
};
const createSnippetFromFiles = fileNames => {

    let newSupplements = [];
    for (let i = 0; i < fileNames.length; i++) {
        let fileName = fileNames[i];
        let supplementLanguage = fileName.split(".").slice(fileName.split(".").length - 1)[0];
        let supplementName = fileName.split(".").slice(0, fileName.split(".").length - 1).join(".");
        let supplementCode;

        if (supplementLanguage == 'json') {
            supplementCode = JSON.stringify(JSON.parse(fs.readFileSync(process.cwd() + "\\" + fileNames[i])), null, 2);
        } else {
            supplementCode = fs.readFileSync(process.cwd() + "\\" + fileNames[i]).toString();
        }

        let supplement = {
            name: supplementName,
            language: supplementLanguage,
            code: supplementCode,
            notes: ''
        }
        newSupplements.push(supplement);
    }
    let snippet = {
        supplements: newSupplements
    }

    return Snippet.createValidSnippet(snippet)
}

module.exports = {
    createNewSnippet: async () => {
        let snippet = createSnippetFromFiles(process.argv.slice(3));
        snippet.title = await promptForTitle();
        snippet.tag = await promptForTags();
        for (let i = 0; i < snippet.supplements.length; i++) {
            snippet.supplements[i].note = await checkForNote(snippet.supplements[i].name)
        }
        exportSnippet(snippet);
        rl.close()
    }
}

function exportSnippet(snippet) {
    request.post(
        exportUrl,
        {
            json: {
                message: {
                    content: snippet
                }
            }
        },
        (error, res, body) => {
            if (error) {
                console.error(error);
                return;
            }
            if (res.statusCode === 200) {
                console.log(
                    "https://jayckers.com/snippet/en/#/import/" + body.conversationId
                );
                clipboardy.writeSync("https://jayckers.com/snippet/en/#/import/" + body.conversationId);
            } else {
                console.log(`statusCode: ${res.statusCode}`);
            }
        }
    );
}