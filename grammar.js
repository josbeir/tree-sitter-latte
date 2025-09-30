/**
 * @file Latte grammar for tree-sitter
 * @author Jos Beir
 * @license MIT
 */

const html = require("./vendor/tree-sitter-html/grammar");

module.exports = grammar(html, {
  name: "latte",

  rules: {
    document: ($) => repeat($._node),

    _node: ($) =>
      choice(
        $.doctype,
        $.entity,
        $.text,
        $.element,
        $.script_element,
        $.style_element,
        $.erroneous_end_tag,
        alias($.latte_comment, $.comment),
        $.block,
        $.macro,
        $.macro_call,
      ),

    // Latte comment {* ... *}
    latte_comment: (_) => token(seq("{*", /[^*]*\*+([^}*][^*]*\*+)*/, "}")),

    block: ($) =>
      seq(
        field("block_start", $.block_start),
        repeat($._node),
        repeat($.elseif_block),
        optional($.else_block),
        field("block_end", $.block_end),
      ),

    block_start: (_) =>
      choice(
        token(seq("{if", /[^}]*/, "}")),
        token(seq("{block", /[^}]*/, "}")),
        token(seq("{foreach", /[^}]*/, "}")),
      ),

    block_end: (_) =>
      choice(
        token(seq("{/if", /[^}]*/, "}")),
        token(seq("{/block", /[^}]*/, "}")),
        token(seq("{/foreach", /[^}]*/, "}")),
      ),

    elseif_block: ($) =>
      seq(
        field("elseif_start", token(seq("{elseif", /[^}]*/, "}"))),
        repeat($._node),
      ),

    else_block: ($) =>
      seq(
        field("else_start", token(seq("{else", /[^}]*/, "}"))),
        repeat($._node),
      ),

    macro: ($) =>
      seq(
        field("macro_start", token(seq("{macro", /[^}]*/, "}"))),
        repeat($._node),
        field("macro_end", token(seq("{/macro", /[^}]*/, "}"))),
      ),

    macro_call: ($) =>
      seq(
        "{",
        field("macro_name", $.macro_name),
        field("macro_args", $.macro_args),
        "}",
      ),

    macro_name: (_) => /[a-zA-Z_][a-zA-Z0-9_]*/,
    macro_args: (_) => /[^}]*/,

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

    // Override text rule to not match Latte tags starting with {
    text: (_) => /[^<>&\s{]([^<>&{]*[^<>&\s{])?/,
  },
});
