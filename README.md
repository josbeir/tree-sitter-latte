
[![CI](https://github.com/josbeir/tree-sitter-latte/actions/workflows/ci.yml/badge.svg)](https://github.com/josbeir/tree-sitter-latte/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE.md)

# tree-sitter-latte ☕

A [tree-sitter](https://tree-sitter.github.io/tree-sitter/) grammar for the [Latte](https://latte.nette.org/) templating language (3.x).

## Features

- Incremental parsing for Latte templates
- Supports core Latte constructs: print tags, blocks, if/else, foreach, comments, includes, and more
- Designed for use in editors, code analysis, and tooling

## Installation

Clone this repository and build the grammar:

```sh
git clone https://github.com/tree-sitter/tree-sitter-latte.git
cd tree-sitter-latte
npm install
npx tree-sitter generate
```

## Usage

You can use this grammar with any tool that supports tree-sitter grammars, such as:

- [Atom](https://github.com/atom/atom)
- [Neovim](https://github.com/nvim-treesitter/nvim-treesitter)
- [Zed editor](https://zed.dev/)
- [tree-sitter CLI](https://tree-sitter.github.io/tree-sitter/using-parsers)

## Testing

To run the test suite:

```sh
npx tree-sitter test
```

To run Node.js bindings tests:

```sh
npm test
```

## Contributing

Pull requests and issues are welcome! Please add tests for new Latte constructs in `test/corpus/latte.txt`.

## Other latte tree-sitter grammars:

- <https://github.com/Bleksak/tree-sitter-latte>

## License

MIT
