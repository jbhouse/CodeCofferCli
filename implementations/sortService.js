module.exports = {
  sortSnippets: snippets => snippets.sort((a, b) => this.compareSnippets(a, b))
};

function compareSnippets(a, b) {
  let result = this.compareShowing(a, b);
  if (result === 0) {
    result = this.compareIndices(a, b);
  }
  if (result === 0) {
    result = this.compareTimestamps(a, b);
  }
  if (result === 0) {
    result = this.compareTitles(a, b);
  }
  return result;
}

/**
 * The alphabetically lowest Snippet title comes first (title "a" comes before title "b")
 * @param a
 * @param b
 */
function compareTitles(a, b) {
  if (a.title > b.title) {
    return 1;
  } else if (b.title > a.title) {
    return -1;
  }
  return 0;
}

/**
 * The alphabetically lowest Snippet index comes first (index "1" comes before index "2")
 * @param a
 * @param b
 */
function compareIndices(a, b) {
  if (a.index > b.index) {
    return 1;
  } else if (b.index > a.index) {
    return -1;
  }
  return 0;
}

/**
 * Snippets that are showing come first (showing "true" comes before showing "false" (showing is not really a string))
 * @param a
 * @param b
 */
function compareShowing(a, b) {
  return +b.showing - +a.showing;
}

/**
 * Snippets that are newer come first (timestamp "today" comes before timestamp "yesterday" (timestamps aren't really strings))
 */
function compareTimestamps(a, b) {
  return b.timestamp - a.timestamp;
}
