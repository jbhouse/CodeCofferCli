#!/usr/bin/env node

const commandToInvoke = process.argv[2];
const userInput = process.argv.slice(3).join(' ');
const commandMap = {
    "configure": () => require('./implementations/configureCodeCofferUser.js')
    ,"import": () => require('./implementations/importSnippet.js').importSnippet(userInput)
    ,"export": () => require('./implementations/exportSnippet.js').exportSnippet(userInput)
    ,"search": () => require('./implementations/searchSnippet.js').searchSnippet(userInput)
    , "new": () => require('./implementations/newSnippet.js').createNewSnippet()
};
commandMap[commandToInvoke]();