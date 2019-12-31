#!/usr/bin/env node
"use strict";
const fs = require('fs');
const readline = require('readline');
const projectBaseDirectory = __dirname.split("\\implementations")[0];
const userConfigFilePath = projectBaseDirectory + "\\" + "userConfig.json";
const userConfiguration = require(userConfigFilePath);

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
const openFilesOnImport = () => {
    return new Promise((resolve, reject) => {
        rl.question("\nWould you like to open snippets when they are imported? (Y/N) \n" + "Currently " + userConfiguration.openFilesOnImport + ": ", (answer) => {
            updateUserConfig(answer, 'openFilesOnImport');
            resolve();
        });
    });
};
const copyToClipboard = () => {
    return new Promise((resolve, reject) => {
        rl.question("\nWould you like to have snippet contents save to your clipboard? (Y/N) \n" + "Currently " + userConfiguration.copyContentsToClipBoard + ": ", (answer) => {
            updateUserConfig(answer, 'copyContentsToClipBoard');
            resolve();
        });
    });
};
const assignDefaultEditorPath = () => {
    return new Promise((resolve, reject) => {
        rl.question("\nYour current editor for opening snippets is: " + userConfiguration.defaultEditor + "\n" + "define the path to the code editor we should open imported/existing snippets in: ", (answer) => {
            userConfiguration.defaultEditor = answer;
            resolve();
        });
    });
};
const openSnippetBeforeExporting = () => {
    return new Promise((resolve, reject) => {
        rl.question("\nWould you like to open snippets locally before exporting them?: (Y/N) \n" + "Currently " + userConfiguration.openSnippetBeforeExporting + ": ", (answer) => {
            updateUserConfig(answer, 'openSnippetBeforeExporting');
            resolve();
        });
    });
};
function updateUserConfig(answer, userPropertyToUpdate) {
    if (answer.toLocaleLowerCase() == 'y' || answer.toLocaleLowerCase() == 'yes') {
        userConfiguration[userPropertyToUpdate] = true;
    }
    if (answer.toLocaleLowerCase() == 'n' || answer.toLocaleLowerCase() == 'no') {
        userConfiguration[userPropertyToUpdate] = false;
    }
}

(async function (userConfigFilePath) {
    console.log("\nLeave the input empty for any of the following to keep your current setting");
    await openFilesOnImport();
    await copyToClipboard();
    await assignDefaultEditorPath();
    if (userConfiguration.defaultEditor != '') {
        await openSnippetBeforeExporting();
    }
    rl.close();
    userConfiguration.userIsConfigured = true;
    fs.writeFileSync(userConfigFilePath, JSON.stringify(userConfiguration, null, 2));
})(userConfigFilePath);