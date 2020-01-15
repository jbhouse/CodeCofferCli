const projectBaseDirectory = __dirname.split("\\implementations")[0];
const snippetBaseDirectory = '\\snippets\\';
const userConfigFilePath = projectBaseDirectory + "\\" + "userConfig.json";
const userConfiguration = require(userConfigFilePath);
const browserOpener = require('opn');
const snippet_1 = require("../models/snippet");
const Snippet = require("../models/snippet").Snippet;
const clipboardy = require('clipboardy');
const baseUrl = 'https://jayckers.com/snippet/en/#/import/';
const readline = require('readline');
const https = require('https');
const fs = require('fs');
const snippetsDirectory = projectBaseDirectory + snippetBaseDirectory;

module.exports = {
    importSnippet: async (userInput) => {
        const id = userInput.split("import/")[1];
        const url = "https://jayman-gameserver.herokuapp.com/conversations/" + id + "?startingIndex=0";
        let callbacks = [saveFile()];
        if (userConfiguration.openFilesOnImport) {
            if (userConfiguration.defaultEditor != '') {
                callbacks.push(openFileInEditor);
            } else {
                callbacks.push(openFileInBrowser(id));
            }
        }
        if (userConfiguration.copyContentsToClipBoard) {
            callbacks.push(saveContentToClipboard);
        }
        getSnippet(url, callbacks);
    }
}

async function openFileInEditor(snippet) {
    let filePaths = transformSupplementNamesToFilePaths(snippet).join(" ");
    require('child_process').exec(userConfiguration.defaultEditor + " " + filePaths);
}
async function openFileInBrowser(snippetId) {
    return () => browserOpener(baseUrl + snippetId);
}
function transformSupplementNamesToFilePaths(snippet) {
    const snippetDirectory = projectBaseDirectory + snippetBaseDirectory + snippet.title;
    return snippet.supplements
        .map(supplement => supplement.name + '.' + supplement.language)
        .map(fileName => '"' + snippetDirectory + "\\" + fileName + '"');
}
const askToModifyFile = (snippet) => {
    return new Promise((resolve, reject) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        rl.question("'" + snippet.title + "' already exists and differs from snippet being imported. Replace the existing snippet? (Y/N): ", (answer) => {
            if (answer.toLocaleLowerCase() == 'y' || answer.toLocaleLowerCase() == 'yes') {
                fs.writeFileSync(snippetsDirectory + snippet.title + "\\" + `${snippet.title}.json`, JSON.stringify(snippet, null, 2));
            }
            rl.close();
            snippet.supplements.forEach(supplement => {
                let fileName = supplement.name + '.' + supplement.language;
                fs.writeFileSync(snippetsDirectory + snippet.title + "\\" + fileName, supplement.code);
            });
            resolve();
        });
    });
};
async function createSnippetFromDirectory(directoryName) {
    let filePath =
        snippetsDirectory + directoryName + "\\" + directoryName + ".json";
    let snippet = Snippet.createValidSnippet(
        JSON.parse(fs.readFileSync(filePath))
    );

    let supplements = fs
        .readdirSync(snippetsDirectory + directoryName)
        .filter(
            fileName =>
                fileName.split(".").slice(fileName.split(".").length - 1)[0] != "json"
        );

    supplements.forEach(supplementName => {
        let snippetSupplement = snippet.supplements.filter(
            supplement =>
                supplement.name + "." + supplement.language === supplementName
        )[0];
        // if the user changes a file name, we could have an issue here
        let content = fs
            .readFileSync(snippetsDirectory + directoryName + "\\" + supplementName)
            .toString();
        snippetSupplement.code = content;
    });

    fs.writeFileSync(filePath, JSON.stringify(snippet, null, 2));

    return snippet;
}
function saveFile() {
    return async (snippet) => {
        return new Promise(async (resolve, reject) => {
            let snippetDirectory = projectBaseDirectory + snippetBaseDirectory + snippet.title;

            if (!fs.existsSync(snippetDirectory)) {
                fs.mkdirSync(snippetDirectory, { recursive: true });
                fs.writeFileSync(snippetDirectory + "\\" + snippet.title + ".json", JSON.stringify(snippet, null, 2));
                snippet.supplements.forEach(supplement => {
                    let fileName = supplement.name + '.' + supplement.language;
                    fs.writeFileSync(snippetDirectory + "\\" + fileName, supplement.code);
                });
                resolve();
            }
            else {
                let existingSnippet = await createSnippetFromDirectory(snippet.title);
                let snippetsAreTheSame = true;
                for (let i = 0; i < snippet.supplements.length; i++) {
                    if (
                        snippet.supplements[i].name != existingSnippet.supplements[i].name ||
                        snippet.supplements[i].language != existingSnippet.supplements[i].language ||
                        snippet.supplements[i].code != existingSnippet.supplements[i].code
                    ) {
                        snippetsAreTheSame = false;
                    }
                }

                if (!snippetsAreTheSame) {
                    await askToModifyFile(snippet)
                }
                resolve();
            }
        });
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
        resp.on('end', async () => {
            const snip = snippet_1.Snippet.createValidSnippet(JSON.parse(data)[0].message.content);
            for (let i = 0; i < callbacks.length; i++) {
                await callbacks[i](snip);
            }
        });
    }).on("error", (err) => {
        console.log("Error: " + err.message);
    });
}
