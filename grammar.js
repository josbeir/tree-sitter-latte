/**
 * @file Latte grammar for tree-sitter
 * @author Josbeir
 * @license MIT
 */

const html = require("./tree-sitter-html/grammar");

// Shared constants for tag names
const BLOCK_TAGS = [
  "block",
  "while",
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
const ELSEIF_VARIANTS = ["elseif", "elseifset"];
const LOOP_TAGS = ["foreach", "for"];
const FILE_TAGS = ["include", "extends", "layout", "import", "sandbox"];

// Single tags without arguments
const SINGLE_TAGS_NO_ARGS = ["rollback", "trace", "debugbreak"];

// Single tags with optional arguments
const SINGLE_TAGS_WITH_ARGS = [
  "parameters",
  "contentType",
  "do",
  "syntax",
  "dump",
  "templatePrint",
  "varPrint",
];

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
        $.latte_single_tag,
        $.if_block,
        $.loop_block,
        $.switch_block,
        $.php_block, // PHP block with raw PHP content
        $.block, // Generic simple blocks (block, while, macro, spaceless, etc.)
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
      seq("{", $.php_only, optional(field("filters", $.filter_chain)), "}"),

    // PHP content inside {$...} - exposed for injection (like Blade)
    // Uses higher precedence to prioritize in {$...} context
    php_only: ($) => prec(1, $._php_variable_base),

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
        field("file", $.file_path),
        optional(field("arguments", $.file_tag_arguments)),
        "}",
      ),

    file_tag_name: (_) => token(seq("{", choice(...FILE_TAGS))),

    file_path: ($) => choice($.string_literal, $.php_variable),

    file_tag_arguments: ($) =>
      seq(
        ",",
        optional(/\s*/),
        seq(
          $.file_tag_argument,
          repeat(seq(",", optional(/\s*/), $.file_tag_argument)),
        ),
      ),

    file_tag_argument: ($) =>
      seq(field("name", $.identifier), ":", field("value", $.expression)),

    // Embed tag {embed 'file.latte'}...{/embed}
    embed_tag: ($) =>
      seq(
        token(seq("{embed", /[^}]+/, "}")),
        repeat($._node),
        token("{/embed}"),
      ),

    // Generic single-line Latte tags
    // Handles: {parameters}, {contentType}, {rollback}, {do}, {trace}, {syntax},
    // {dump}, {debugbreak}, {templatePrint}, {varPrint}
    latte_single_tag: (_) =>
      token(
        seq(
          "{",
          choice(
            "parameters",
            "contentType",
            "rollback",
            "do",
            "trace",
            "syntax",
            "dump",
            "debugbreak",
            "templatePrint",
            "varPrint",
          ),
          optional(/[^}]+/),
          "}",
        ),
      ),

    embed_end: (_) => token("{/embed}"),

    // Generic single-line Latte tags
    latte_single_tag: ($) =>
      choice(
        // Tags without arguments
        seq(
          field("tag_name", token(seq("{", choice(...SINGLE_TAGS_NO_ARGS)))),
          "}",
        ),
        // dump/varPrint/templatePrint - expression based
        seq(
          field(
            "tag_name",
            token(seq("{", choice("dump", "varPrint", "templatePrint"))),
          ),
          optional(/\s+/),
          optional(field("expression", $._expression_with_filters)),
          "}",
        ),
        // do/parameters/contentType/syntax - raw arguments (complex PHP/type syntax)
        seq(
          field(
            "tag_name",
            token(
              seq("{", choice("do", "parameters", "contentType", "syntax")),
            ),
          ),
          optional(/\s+/),
          optional(field("arguments", token(/[^}]+/))),
          "}",
        ),
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
        seq(
          "->",
          field("method", $.identifier),
          "(",
          optional($.argument_list),
          ")",
        ),
        seq("[", field("index", $.expression), "]"),
        seq("::", field("constant", $.identifier)),
      ),

    // Expression (without filters)
    expression: ($) =>
      choice(
        $.php_variable,
        $.function_call,
        $.binary_expression,
        $.unary_expression,
        $.ternary_expression,
        $.string_literal,
        $.number_literal,
        $.boolean_literal,
        $.null_literal,
        $.array_literal,
        $.static_call,
        $.parenthesized_expression,
      ),

    parenthesized_expression: ($) => seq("(", $.expression, ")"),

    binary_expression: ($) =>
      choice(
        prec.left(
          10,
          seq(
            field("left", $.expression),
            field("operator", "**"),
            field("right", $.expression),
          ),
        ),
        prec.left(
          9,
          seq(
            field("left", $.expression),
            field("operator", choice("*", "/", "%")),
            field("right", $.expression),
          ),
        ),
        prec.left(
          8,
          seq(
            field("left", $.expression),
            field("operator", choice("+", "-", ".")),
            field("right", $.expression),
          ),
        ),
        prec.left(
          7,
          seq(
            field("left", $.expression),
            field("operator", choice("<", "<=", ">", ">=", "<=>")),
            field("right", $.expression),
          ),
        ),
        prec.left(
          6,
          seq(
            field("left", $.expression),
            field("operator", choice("==", "!=", "===", "!==", "<>")),
            field("right", $.expression),
          ),
        ),
        prec.left(
          5,
          seq(
            field("left", $.expression),
            field("operator", "&&"),
            field("right", $.expression),
          ),
        ),
        prec.left(
          4,
          seq(
            field("left", $.expression),
            field("operator", "||"),
            field("right", $.expression),
          ),
        ),
        prec.left(
          3,
          seq(
            field("left", $.expression),
            field("operator", "??"),
            field("right", $.expression),
          ),
        ),
        prec.left(
          2,
          seq(
            field("left", $.expression),
            field("operator", "and"),
            field("right", $.expression),
          ),
        ),
        prec.left(
          1,
          seq(
            field("left", $.expression),
            field("operator", "or"),
            field("right", $.expression),
          ),
        ),
      ),

    unary_expression: ($) =>
      prec(
        11,
        seq(
          field("operator", choice("!", "not", "-", "+")),
          field("operand", $.expression),
        ),
      ),

    ternary_expression: ($) =>
      prec.right(
        0,
        seq(
          field("condition", $.expression),
          "?",
          field("consequence", $.expression),
          ":",
          field("alternative", $.expression),
        ),
      ),

    function_call: ($) =>
      prec(
        12,
        seq(
          field("function", $.identifier),
          "(",
          optional(field("arguments", $.argument_list)),
          ")",
        ),
      ),

    static_call: ($) =>
      prec(
        12,
        seq(
          field("class", $.identifier),
          "::",
          choice(
            field("constant", $.identifier),
            seq(
              field("method", $.identifier),
              "(",
              optional(field("arguments", $.argument_list)),
              ")",
            ),
          ),
        ),
      ),

    argument_list: ($) => seq($.expression, repeat(seq(",", $.expression))),

    array_literal: ($) =>
      seq(
        "[",
        optional(
          seq(
            $._array_element,
            repeat(seq(",", $._array_element)),
            optional(","),
          ),
        ),
        "]",
      ),

    _array_element: ($) =>
      choice(
        $.expression,
        seq(field("key", $.expression), "=>", field("value", $.expression)),
        seq(field("key", $.identifier), ":", field("value", $.expression)),
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

    if_start: (_) => blockTag(IF_VARIANTS).start,

    if_end: (_) => blockTag(IF_VARIANTS).end,

    elseif_block: ($) => seq($.elseif_start, repeat($._node)),

    elseif_start: (_) => blockTag(ELSEIF_VARIANTS).start,

    else_block: ($) => seq($.else_start, repeat($._node)),

    else_start: (_) => token("{else}"),

    // Loop blocks (foreach/for) - can have optional {else} block
    loop_block: ($) =>
      seq(
        field("open", $.loop_start),
        repeat($._node),
        optional($.else_block),
        field("close", $.loop_end),
      ),

    loop_start: (_) => blockTag(LOOP_TAGS).start,

    loop_end: (_) => blockTag(LOOP_TAGS).end,

    // Switch block
    switch_block: ($) =>
      seq(
        field("open", $.switch_start),
        repeat(choice($.case_block, $.default_case_block)),
        field("close", $.switch_end),
      ),

    switch_start: (_) => token(seq("{switch", /[^}]*/, "}")),
    switch_end: (_) => token("{/switch}"),

    case_block: ($) => seq($.case_start, repeat($._node)),

    case_start: (_) => token(seq("{case", /[^}]*/, "}")),

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
