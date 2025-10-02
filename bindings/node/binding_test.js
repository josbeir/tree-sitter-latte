//const assert = require("node:assert");
const { test } = require("node:test");

const Parser = require("tree-sitter");
const latte = require(".");

test("can load grammar", () => {
  const parser = new Parser();
  parser.setLanguage(latte);
  //assert.doesNotThrow(() => parser.setLanguage(require(".")));
});
