/**
 * @file Latte grammar for tree-sitter
 * @author Josbeir
 * @license MIT
 */

const html = require("./tree-sitter-html/grammar");

// Shared constants for tag names
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

// Helper to create open/close tag pairs
function blockTag(tagNames, content = /[^}]*/) {
  const tags = Array.isArray(tagNames) ? tagNames : [tagNames];
  return {
    start: token(seq("{", choice(...tags), optional(content), "}")),
    end: token(seq("{/", choice(...tags), "}")),
  };
}

function blockTagWithOptionalClose(tagNames, content = /[^}]*/) {
  const tags = Array.isArray(tagNames) ? tagNames : [tagNames];
  return {
    start: token(seq("{", choice(...tags), optional(content), "}")),
    end: token(seq("{/", choice(...tags), optional(content), "}")),
  };
}

// Helper to create a string literal with a given quote character
function stringWithQuote(quote) {
  const escaped = quote === "'" ? /([^'\\]|\\.)*/ : /([^"\\]|\\.)*/;
  return seq(quote, optional(escaped), quote);
}

module.exports = grammar(html, {
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
        // Latte tags - more specific patterns first
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
        $.php_block, // PHP block with raw PHP content
        $.block, // Generic simple blocks (block, macro, spaceless, etc.)
        // macro_call must come before latte_expression_tag to match simple function-like
        // macros (e.g., {include ...}) before they're parsed as generic expressions
        $.macro_call,
        $.latte_expression_tag, // Generic expression tag - catch-all for {expression}
        // Text must come last as it's a catch-all
        $.text,
      ),

    // Latte comment {* ... *}
    latte_comment: (_) => token(seq("{*", /[^*]*\*+([^}*][^*]*\*+)*/, "}")),

    // Latte print tag {= ... }
    latte_print_tag: ($) =>
      seq("{=", field("expression", $._expression_with_filters), "}"),

    // Latte variable {$variable}
    latte_variable: ($) =>
      prec(
        2,
        seq(
          "{",
          field("variable", $._php_variable_base),
          optional(field("filters", $.filter_chain)),
          "}",
        ),
      ),

    // PHP content - exposed for injection
    // Matches any PHP expression content
    php_only: (_) => /[^|}]+/,

    // Variable assignment tags: {var $var = 'value'} and {default $var = 'value'}
    latte_assignment_tag: ($) =>
      seq(
        token(choice("{var", "{default")),
        field("variable", $.php_variable),
        "=",
        field("value", $._expression_with_filters),
        "}",
      ),

    // VarType tag {varType Type $var}
    var_type_tag: ($) =>
      seq(
        "{varType",
        field("type", $.type_identifier),
        field("variable", $.php_variable),
        "}",
      ),

    // TemplateType tag {templateType ClassName}
    template_type_tag: ($) =>
      seq("{templateType", field("type", $.type_identifier), "}"),

    // Type identifier: FQDN, primitive types, or array types
    type_identifier: (_) =>
      choice(
        // Primitive types
        /string|int|float|bool|array|object|mixed|void|null/,
        // Class name (FQDN or simple) with optional array suffix
        // Examples: App\Model\User, User, User[], App\Model\User[]
        /[A-Z][a-zA-Z0-9_]*(\\[A-Z][a-zA-Z0-9_]*)*(\[\])?/,
      ),

    // Capture tag {capture $var}...{/capture}
    capture_tag: ($) =>
      seq(
        "{capture",
        field("variable", $.php_variable),
        "}",
        repeat($._node),
        "{/capture}",
      ),

    // File-related tags: {include}, {extends}, {layout}, {import}, {sandbox}
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

    // Embed tag {embed 'file.latte'}...{/embed}
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

    // Expression with optional filters
    _expression_with_filters: ($) =>
      seq(
        field("expression", $.expression),
        optional(field("filters", $.filter_chain)),
      ),

    // PHP variable with property/array access
    // Uses left-associativity for expression context
    php_variable: ($) => prec.left($._php_variable_base),

    // Shared base pattern for PHP variables
    _php_variable_base: ($) =>
      seq("$", field("name", $.identifier), repeat($._variable_accessor)),

    _variable_accessor: ($) =>
      choice(
        seq("->", field("property", $.identifier)),
        seq("->", field("method", $.identifier), "(", optional(/[^)]+/), ")"),
        seq("[", field("index", $.expression), "]"),
        seq("::", field("constant", $.identifier)),
      ),

    // Minimal expression grammar for Latte-specific contexts
    // Used in {= expression }, {var $x = expression}, and $var[expression]
    // Complex PHP expressions are handled via injections
    expression: ($) =>
      choice(
        $.php_variable,
        $.string_literal,
        $.number_literal,
        $.boolean_literal,
        $.null_literal,
        $.identifier, // For simple identifiers and function names
      ),

    identifier: (_) => /[a-zA-Z_\x80-\xff][a-zA-Z0-9_\x80-\xff]*/,

    string_literal: (_) => choice(stringWithQuote("'"), stringWithQuote('"')),

    number_literal: (_) =>
      choice(
        /[0-9]+\.[0-9]+([eE][+-]?[0-9]+)?/, // float (keep first due to specificity)
        /[0-9]+/, // integer (common, but after float to avoid ambiguity)
        /[0-9]+[eE][+-]?[0-9]+/, // scientific
        /0[xX][0-9a-fA-F]+/, // hex
        /0[bB][01]+/, // binary
        /0[oO][0-7]+/, // octal
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

    // PHP tag: {php ...} or multiline {php\n...\n}
    // Uses single closing brace, not {/php}
    php_block: (_) =>
      seq(
        token("{php"),
        optional(alias(token(prec(-1, /[^}]*/)), "php_content")),
        token("}"),
      ),

    // Simple blocks - handles: block, while, macro, and all generic blocks
    // Pattern: {tag ...}...{/tag}
    block: ($) =>
      seq(
        field("open", $.block_start),
        repeat($._node),
        field("close", $.block_end),
      ),

    block_start: (_) => blockTagWithOptionalClose(BLOCK_TAGS).start,

    block_end: (_) => blockTagWithOptionalClose(BLOCK_TAGS).end,

    // If block with elseif/else support
    if_block: ($) =>
      seq(
        field("open", $.if_start),
        repeat($._node),
        repeat($.elseif_block),
        optional($.else_block),
        field("close", $.if_end),
      ),

    if_start: ($) =>
      seq(
        token(choice("{if", "{ifset", "{ifchanged")),
        optional(seq(/\s+/, field("condition", $.php_only))),
        token("}"),
      ),

    if_end: (_) => blockTag(IF_VARIANTS).end,

    elseif_block: ($) => seq($.elseif_start, repeat($._node)),

    elseif_start: ($) =>
      seq(
        token(choice("{elseif", "{elseifset")),
        optional(seq(/\s+/, field("condition", $.php_only))),
        token("}"),
      ),

    else_block: ($) => seq($.else_start, repeat($._node)),

    else_start: (_) => token("{else}"),

    // Loop blocks (foreach/for/while) - can have optional {else} block
    loop_block: ($) =>
      seq(
        field("open", $.loop_start),
        repeat($._node),
        optional($.else_block),
        field("close", $.loop_end),
      ),

    loop_start: ($) =>
      seq(
        token(choice("{foreach", "{for", "{while")),
        optional(seq(/\s+/, field("content", $.php_only))),
        token("}"),
      ),

    loop_end: (_) => token(choice("{/foreach}", "{/for}", "{/while}")),

    // Switch block
    switch_block: ($) =>
      seq(
        field("open", $.switch_start),
        repeat(choice($.case_block, $.default_case_block)),
        field("close", $.switch_end),
      ),

    switch_start: ($) =>
      seq(
        token("{switch"),
        optional(seq(/\s+/, field("expression", $.php_only))),
        token("}"),
      ),

    switch_end: (_) => token("{/switch}"),

    case_block: ($) => seq($.case_start, repeat($._node)),

    case_start: ($) =>
      seq(
        token("{case"),
        optional(seq(/\s+/, field("value", $.php_only))),
        token("}"),
      ),

    default_case_block: ($) => seq($.default_start, repeat($._node)),

    default_start: (_) => token("{default}"),

    // Macro call: {macroName arg1 arg2}
    // Uses token with precedence to match simple identifier+args patterns
    // before falling back to latte_expression_tag for complex expressions
    macro_call: ($) =>
      seq(
        "{",
        field("name", $.macro_name),
        optional(field("arguments", $.macro_arguments)),
        "}",
      ),

    macro_name: (_) => token(prec(1, /[a-zA-Z_][a-zA-Z0-9_]*/)),

    macro_arguments: (_) => /\s+[^}]+/,

    // Generic expression tag for complex expressions like {count(...)} or {Status::Published}
    // This is a catch-all for any Latte tag that contains an expression
    latte_expression_tag: ($) => seq("{", $._expression_with_filters, "}"),

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
