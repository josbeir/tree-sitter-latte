/**
 * @file Latte grammar for tree-sitter
 * @author Josbeir
 * @license MIT
 */

import html from "./tree-sitter-html/grammar.js";

const BLOCK_TAGS = [
  "block",
  "macro",
  "spaceless",
  "translate",
  "try",
  "cache",
  "define",
  "snippet",
  "snippetArea",
  "iterateWhile",
];

const IF_VARIANTS = ["if", "ifset", "ifchanged"];
const FILE_TAGS = ["include", "extends", "layout", "import", "sandbox"];

function stringWithQuote(quote) {
  const escaped = quote === "'" ? /([^'\\]|\\.)*/ : /([^"\\]|\\.)*/;
  return seq(quote, optional(escaped), quote);
}

export default grammar(html, {
  name: "latte",

  extras: ($) => [/\s/, $.latte_comment],

  word: ($) => $.identifier,

  rules: {
    document: ($) => repeat($._node),

    _node: ($) =>
      choice(
        $.doctype,
        $.entity,
        $.element,
        $.script_element,
        $.style_element,
        $.erroneous_end_tag,
        alias($.latte_comment, $.comment),
        $.latte_print_tag,
        $.latte_variable,
        $.latte_assignment_tag,
        $.var_type_tag,
        $.template_type_tag,
        $.capture_tag,
        $.latte_file_tag,
        $.embed_tag,
        $.if_block,
        $.loop_block,
        $.switch_block,
        $.php_block,
        $.block,
        $.macro_call,
        $.latte_expression_tag,
        $.text,
      ),

    // {* comment *}
    latte_comment: (_) => token(seq("{*", /[^*]*\*+([^}*][^*]*\*+)*/, "}")),

    // {= expression}
    latte_print_tag: ($) =>
      seq("{=", $.php_only, optional($.filter_chain), "}"),

    // {$variable}
    latte_variable: ($) =>
      prec(2, seq("{", $.php_only, optional($.filter_chain), "}")),

    php_only: (_) => /[^|}]+/,

    // {var $x = value}, {default $x = value}
    latte_assignment_tag: ($) =>
      seq(token(choice("{var", "{default")), /\s+/, $.php_only, "}"),

    // {varType Type $var}
    var_type_tag: ($) => seq("{varType", /\s+/, $.php_only, "}"),

    // {templateType ClassName}
    template_type_tag: ($) => seq("{templateType", /\s+/, $.php_only, "}"),

    // {capture $var}...{/capture}
    capture_tag: ($) =>
      seq("{capture", /\s+/, $.php_only, "}", repeat($._node), "{/capture}"),

    // {include 'file.latte'}, {extends}, {layout}, {import}, {sandbox}
    latte_file_tag: ($) =>
      seq(
        field("tag_name", $.file_tag_name),
        optional(/\s+/),
        field("file", $.file_path),
        optional(field("arguments", $.file_tag_arguments)),
        "}",
      ),

    file_tag_name: (_) => token(seq("{", choice(...FILE_TAGS))),

    file_path: ($) => choice($.string_literal, $.php_variable),

    file_tag_arguments: ($) => seq(/,\s*/, $.php_only),

    // {embed 'file.latte'}...{/embed}
    embed_tag: ($) =>
      seq(
        token("{embed"),
        optional(/\s+/),
        field("file", $.file_path),
        optional(field("arguments", $.file_tag_arguments)),
        token("}"),
        repeat($._node),
        token("{/embed}"),
      ),

    _expression_with_filters: ($) =>
      seq(
        field("expression", $.expression),
        optional(field("filters", $.filter_chain)),
      ),

    php_variable: ($) => prec.left($._php_variable_base),

    _php_variable_base: ($) =>
      seq("$", field("name", $.identifier), repeat($._variable_accessor)),

    _variable_accessor: ($) =>
      choice(
        seq("->", field("property", $.identifier)),
        seq("->", field("method", $.identifier), "(", optional(/[^)]+/), ")"),
        seq("[", field("index", $.expression), "]"),
        seq("::", field("constant", $.identifier)),
      ),

    expression: ($) =>
      choice(
        $.php_variable,
        $.string_literal,
        $.number_literal,
        $.boolean_literal,
        $.null_literal,
        $.identifier,
      ),

    identifier: (_) => /[a-zA-Z_\x80-\xff][a-zA-Z0-9_\x80-\xff]*/,

    string_literal: (_) => choice(stringWithQuote("'"), stringWithQuote('"')),

    number_literal: (_) =>
      choice(
        /[0-9]+\.[0-9]+([eE][+-]?[0-9]+)?/,
        /[0-9]+/,
        /[0-9]+[eE][+-]?[0-9]+/,
        /0[xX][0-9a-fA-F]+/,
        /0[bB][01]+/,
        /0[oO][0-7]+/,
      ),

    boolean_literal: (_) =>
      choice("true", "false", "TRUE", "FALSE", "True", "False"),

    null_literal: (_) => choice("null", "NULL", "Null"),

    filter_chain: ($) => repeat1($.filter),

    filter: ($) =>
      seq(
        optional(/\s+/),
        "|",
        field("filter_name", $.filter_name),
        optional(field("filter_args", $.filter_args)),
      ),

    filter_name: (_) => /[a-zA-Z_][a-zA-Z0-9_]*/,

    filter_args: (_) => /:[^|}]+/,

    // {php ...}
    php_block: (_) =>
      seq(
        token("{php"),
        optional(alias(token(prec(-1, /[^}]*/)), "php_content")),
        token("}"),
      ),

    // {block}...{/block}, {macro}...{/macro}, etc.
    block: ($) =>
      seq(
        field(
          "open",
          seq(
            alias(token(seq("{", choice(...BLOCK_TAGS))), $.directive_start),
            optional(seq(/\s+/, field("arguments", $.php_only))),
            token("}"),
          ),
        ),
        repeat($._node),
        field(
          "close",
          alias(
            token(seq("{/", choice(...BLOCK_TAGS), optional(/[^}]*/))),
            $.directive_end,
          ),
        ),
      ),

    // {if}...{elseif}...{else}...{/if}
    if_block: ($) =>
      seq(
        field(
          "open",
          seq(
            alias(
              token(seq("{", choice("if", "ifset", "ifchanged"))),
              $.directive_start,
            ),
            optional(seq(/\s+/, field("condition", $.php_only))),
            token("}"),
          ),
        ),
        repeat($._node),
        repeat($.elseif_block),
        optional($.else_block),
        field(
          "close",
          alias(token(seq("{/", choice(...IF_VARIANTS), "}")), $.directive_end),
        ),
      ),

    elseif_block: ($) =>
      seq(
        seq(
          alias(
            token(seq("{", choice("elseif", "elseifset"))),
            $.directive_start,
          ),
          optional(seq(/\s+/, field("condition", $.php_only))),
          token("}"),
        ),
        repeat($._node),
      ),

    else_block: ($) => seq($.else_start, repeat($._node)),

    else_start: (_) => token("{else}"),

    // {foreach}...{/foreach}, {for}...{/for}, {while}...{/while}
    loop_block: ($) =>
      seq(
        field(
          "open",
          seq(
            alias(
              token(seq("{", choice("foreach", "for", "while"))),
              $.directive_start,
            ),
            optional(seq(/\s+/, field("content", $.php_only))),
            token("}"),
          ),
        ),
        repeat($._node),
        optional($.else_block),
        field(
          "close",
          alias(
            token(choice("{/foreach}", "{/for}", "{/while}")),
            $.directive_end,
          ),
        ),
      ),

    // {switch}...{case}...{default}...{/switch}
    switch_block: ($) =>
      seq(
        field(
          "open",
          seq(
            alias(token(seq("{", "switch")), $.directive_start),
            optional(seq(/\s+/, field("expression", $.php_only))),
            token("}"),
          ),
        ),
        repeat(choice($.case_block, $.default_case_block)),
        field("close", alias(token("{/switch}"), $.directive_end)),
      ),

    case_block: ($) =>
      seq(
        seq(
          alias(token(seq("{", "case")), $.directive_start),
          optional(seq(/\s+/, field("value", $.php_only))),
          token("}"),
        ),
        repeat($._node),
      ),

    default_case_block: ($) => seq($.default_start, repeat($._node)),

    default_start: (_) => token("{default}"),

    // {macroName arg1 arg2}
    macro_call: ($) =>
      seq(
        "{",
        field("name", $.macro_name),
        optional(field("arguments", $.macro_arguments)),
        "}",
      ),

    macro_name: (_) => token(prec(1, /[a-zA-Z_][a-zA-Z0-9_]*/)),

    macro_arguments: (_) => /\s+[^}]+/,

    latte_expression_tag: ($) => seq("{", $.php_only, "}"),

    quoted_attribute_value: ($) =>
      choice(
        seq(
          "'",
          optional(
            choice($.latte_expression, alias(/[^'{]+/, $.attribute_value)),
          ),
          "'",
        ),
        seq(
          '"',
          optional(
            choice($.latte_expression, alias(/[^"{]+/, $.attribute_value)),
          ),
          '"',
        ),
      ),

    latte_expression: (_) => token(seq("{", /[^}]+/, "}")),

    text: (_) => /[^<>&\s{]([^<>&{]*[^<>&\s{])?/,
  },
});
