const projectBaseDirectory = __dirname.split("\\implementations")[0];
const snippetBaseDirectory = "\\snippets\\";
const snippetsDirectory = projectBaseDirectory + snippetBaseDirectory;
const fs = require("fs");
const snippetsNames = fs.readdirSync(snippetsDirectory);
const Snippet = require("../models/snippet").Snippet;
const inquirer = require("inquirer");
const userConfigFilePath = projectBaseDirectory + "\\" + "userConfig.json";
const userConfig = require(userConfigFilePath);
const sortService = require("./sortService");
const readline = require("readline");
const promptForEditorPath = rl => {
  return new Promise((resolve, reject) => {
    rl.question(
      "A local text editor must be specified in order to open the snippet(s) you have searched for\n Please enter the path to the text editor you want to use: ",
      answer => {
        userConfig.defaultEditor = answer;
        fs.writeFileSync(
          userConfigFilePath,
          JSON.stringify(userConfig, null, 2)
        );
        resolve();
      }
    );
  });
};

module.exports = {
  searchSnippet: (userInput) => {
    let snippetList = snippetsNames.map(snippetName =>
      createSnippetFromDirectory(snippetName)
    );

    inquirer
      .prompt([
        {
          name: "searchOptions",
          message: "\nWhat would you like to search on?\nPress enter to confirm",
          type: "checkbox",
          choices: userConfig.choices
        }
      ])
      .then(answers => {
        userConfig.choices = [
          { name: "title", checked: false },
          { name: "tags", checked: false },
          { name: "code", checked: false },
          { name: "notes", checked: false }
        ];
        answers.searchOptions.forEach(answer => {
          userConfig.choices.filter(
            searchChoice => searchChoice.name === answer
          )[0].checked = true;
        });
        fs.writeFileSync(userConfigFilePath, JSON.stringify(userConfig, null, 2));

        let searchParams = { query: userInput };
        userConfig.choices.forEach(choice => {
          searchParams[choice.name] = choice.checked;
        });

        search(searchParams, snippetList);
      });
  }
}

function createSnippetFromDirectory(directoryName) {
  let filePath =
    snippetsDirectory + directoryName + "\\" + directoryName + ".json";
  return Snippet.createValidSnippet(JSON.parse(fs.readFileSync(filePath)));
}

async function search(searchParams, snipList) {
  let snippets = snipList;
  const query = searchParams.query.trim();
  const searchResultsMap = new Map();
  const terms = query
    .toLocaleUpperCase()
    .split(",")
    .map(str => str.trim());
  terms
    .filter(term => term.length)
    .forEach(term =>
      snippets.forEach(snippet => {
        let score = searchResultsMap.has(snippet)
          ? searchResultsMap.get(snippet)
          : 0;
        if (
          searchParams.title &&
          snippet.title.toLocaleUpperCase().includes(term)
        ) {
          score++;
        }
        if (searchParams.tags && snippet.tags.toLocaleUpperCase().split(",").map(s => s.trim()).some(tag => tag === term)) {
          score++;
        }
        if (searchParams.code && snippet.supplements
          .map(supplement => supplement.code.toLocaleUpperCase())
          .some(code => code.includes(term))) {
              score++;
        }
        if (searchParams.notes && snippet.supplements
    .map(supplement => supplement.notes.toLocaleUpperCase())
    .some(notes => notes.includes(term))) {
          score++;
        }
        searchResultsMap.set(snippet, score);
      })
    );

  snippets.forEach(snippet => {
    const hasPositiveSearchScore =
      searchResultsMap.has(snippet) && searchResultsMap.get(snippet) > 0;
    snippet.showing = hasPositiveSearchScore || query.length === 0;
  });
  if (query.length > 0) {
    snippets.sort((a, b) =>
      a.showing && b.showing
        ? searchResultsMap.get(b) - searchResultsMap.get(a)
        : +b.showing - +a.showing
    );
  } else {
    sortService.sortSnippets(snippets);
  }

  if (userConfig.defaultEditor === "") {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    await promptForEditorPath(rl);
    rl.close();
  }
  snippets = snippets.filter(snip => snip.showing);
  if (snippets.length === 0) {
    console.log("no results were found for that search");
  }
  promptUserToSelectSnippetsToOpen(snippets);
}

async function promptUserToSelectSnippetsToOpen(snippets) {
  inquirer
    .prompt([
      {
        name: "snippetSelectOptions",
        message:
          "\nWhich snippets would you like to open?\nPress enter to confirm",
        type: "checkbox",
        choices: snippets.map(snippet => snippet.title)
      }
    ])
    .then(answers => {
      answers.snippetSelectOptions.forEach(answer => {
        require("child_process").exec(
          userConfig.defaultEditor + ' "' + snippetsDirectory + answer + '"'
        );
      });
    });
}
