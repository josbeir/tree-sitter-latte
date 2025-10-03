/**
 * @file Latte grammar for tree-sitter
 * @author Josbeir
 * @license MIT
 */

const html = require("./tree-sitter-html/grammar");

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
        $.macro_call, // Try macro call first
        $.latte_expression_tag, // Fall back to expression tag
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
    php_only: ($) =>
      prec(
        1,
        seq("$", field("name", $.identifier), repeat($._variable_accessor)),
      ),
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
    latte_file_tag: (_) =>
      token(
        seq(
          "{",
          choice("include", "extends", "layout", "import", "sandbox"),
          /[^}]+/,
          "}",
        ),
      ),

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

    // Expression with optional filters
    _expression_with_filters: ($) =>
      seq(
        field("expression", $.expression),
        optional(field("filters", $.filter_chain)),
      ),

    // PHP variable with property/array access
    php_variable: ($) =>
      prec.left(
        seq("$", field("name", $.identifier), repeat($._variable_accessor)),
      ),

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

    string_literal: (_) =>
      choice(
        seq("'", optional(/([^'\\]|\\.)*/), "'"),
        seq('"', optional(/([^"\\]|\\.)*/), '"'),
      ),

    number_literal: (_) =>
      choice(
        /[0-9]+\.[0-9]+([eE][+-]?[0-9]+)?/, // float
        /[0-9]+[eE][+-]?[0-9]+/, // scientific
        /0[xX][0-9a-fA-F]+/, // hex
        /0[bB][01]+/, // binary
        /0[oO][0-7]+/, // octal
        /[0-9]+/, // integer
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

    block_start: (_) =>
      token(
        seq(
          "{",
          choice(
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
          ),
          optional(/[^}]*/),
          "}",
        ),
      ),

    block_end: (_) =>
      token(
        seq(
          "{/",
          choice(
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
          ),
          optional(/[^}]*/),
          "}",
        ),
      ),

    // If block with elseif/else support
    if_block: ($) =>
      seq(
        field("open", $.if_start),
        repeat($._node),
        repeat($.elseif_block),
        optional($.else_block),
        field("close", $.if_end),
      ),

    if_start: (_) =>
      choice(
        token(seq("{if", /[^}]*/, "}")),
        token(seq("{ifset", /[^}]*/, "}")),
        token(seq("{ifchanged", /[^}]*/, "}")),
      ),

    if_end: (_) =>
      choice(token("{/if}"), token("{/ifset}"), token("{/ifchanged}")),

    elseif_block: ($) => seq($.elseif_start, repeat($._node)),

    elseif_start: (_) =>
      choice(
        token(seq("{elseif", /[^}]*/, "}")),
        token(seq("{elseifset", /[^}]*/, "}")),
      ),

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

    loop_start: (_) => token(seq("{", choice("foreach", "for"), /[^}]*/, "}")),

    loop_end: (_) => token(seq("{/", choice("foreach", "for"), "}")),

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

    macro_call: ($) =>
      seq(
        "{",
        field("name", $.macro_name),
        optional(field("arguments", $.macro_arguments)),
        "}",
      ),

    macro_name: (_) => token(prec(1, /[a-zA-Z_][a-zA-Z0-9_]*/)),

    macro_arguments: (_) => /\s+[^}]+/,

    // Generic expression tag for things like {count(...)} or {Status::Published}
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
