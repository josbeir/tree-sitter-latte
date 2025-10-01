/**
 * @file Latte grammar for tree-sitter
 * @author Jos Beir
 * @license MIT
 */

const html = require("./tree-sitter-html/grammar");

module.exports = grammar(html, {
  name: "latte",

  extras: ($) => [/\s/, $.latte_comment],

  conflicts: ($) => [],

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
        $.var_tag,
        $.var_type_tag,
        $.template_type_tag,
        $.default_tag,
        $.capture_tag,
        $.include_tag,
        $.extends_tag,
        $.layout_tag,
        $.embed_tag,
        $.import_tag,
        $.sandbox_tag,
        $.dump_tag,
        $.debugbreak_tag,
        $.template_print_tag,
        $.var_print_tag,
        $.block,
        $.if_block,
        $.foreach_block,
        $.for_block,
        $.while_block,
        $.switch_block,
        $.macro,
        $.macro_call,
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
      seq(
        "{$",
        field("name", $.identifier),
        repeat($._variable_accessor),
        optional(field("filters", $.filter_chain)),
        "}",
      ),

    // Variable assignment {var $var = 'value'}
    var_tag: ($) =>
      seq(
        "{var",
        field("variable", $.php_variable),
        "=",
        field("value", $._expression_with_filters),
        "}",
      ),

    // Default tag {default $var = 'value'}
    default_tag: ($) =>
      seq(
        "{default",
        field("variable", $.php_variable),
        "=",
        field("value", $._expression_with_filters),
        "}",
      ),

    // VarType tag {varType Type $var}
    var_type_tag: (_) => token(seq("{varType", /[^}]+/, "}")),

    // TemplateType tag {templateType ClassName}
    template_type_tag: (_) => token(seq("{templateType", /[^}]+/, "}")),

    // Capture tag {capture $var}...{/capture}
    capture_tag: ($) =>
      seq(
        "{capture",
        field("variable", $.php_variable),
        "}",
        repeat($._node),
        "{/capture}",
      ),

    // Include tag {include 'file.latte'}
    include_tag: (_) => token(seq("{include", /[^}]+/, "}")),

    // Extends tag {extends 'layout.latte'}
    extends_tag: (_) => token(seq("{extends", /[^}]+/, "}")),

    // Layout tag {layout 'layout.latte'}
    layout_tag: (_) => token(seq("{layout", /[^}]+/, "}")),

    // Embed tag {embed 'file.latte'}...{/embed}
    embed_tag: ($) =>
      seq(
        token(seq("{embed", /[^}]+/, "}")),
        repeat($._node),
        token("{/embed}"),
      ),

    // Import tag {import 'file.latte'}
    import_tag: (_) => token(seq("{import", /[^}]+/, "}")),

    // Sandbox tag {sandbox 'file.latte'}
    sandbox_tag: (_) => token(seq("{sandbox", /[^}]+/, "}")),

    // Dump tag {dump $var}
    dump_tag: (_) => token(seq("{dump", optional(/[^}]+/), "}")),

    // Debugbreak tag {debugbreak}
    debugbreak_tag: (_) => token(seq("{debugbreak", optional(/[^}]+/), "}")),

    // TemplatePrint tag {templatePrint}
    template_print_tag: (_) => token("{templatePrint}"),

    // VarPrint tag {varPrint}
    var_print_tag: (_) => token("{varPrint}"),

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
            field("operator", choice("<", "<=", ">", ">=", "<=>", "<=>")),
            field("right", $.expression),
          ),
        ),
        prec.left(
          6,
          seq(
            field("left", $.expression),
            field("operator", choice("==", "!=", "===", "!==", "<>", "<>")),
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

    // Generic block (for {block name})
    block: ($) =>
      seq(
        field("open", $.block_start),
        repeat($._node),
        field("close", $.block_end),
      ),

    block_start: (_) => token(seq("{block", /[^}]*/, "}")),
    block_end: (_) => token(seq("{/block", /[^}]*/, "}")),

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

    // Foreach block
    foreach_block: ($) =>
      seq(
        field("open", $.foreach_start),
        repeat($._node),
        optional($.else_block),
        field("close", $.foreach_end),
      ),

    foreach_start: (_) => token(seq("{foreach", /[^}]*/, "}")),
    foreach_end: (_) => token("{/foreach}"),

    // For block
    for_block: ($) =>
      seq(
        field("open", $.for_start),
        repeat($._node),
        optional($.else_block),
        field("close", $.for_end),
      ),

    for_start: (_) => token(seq("{for", /[^}]*/, "}")),
    for_end: (_) => token("{/for}"),

    // While block
    while_block: ($) =>
      seq(
        field("open", $.while_start),
        repeat($._node),
        field("close", $.while_end),
      ),

    while_start: (_) => token(seq("{while", /[^}]*/, "}")),
    while_end: (_) => token("{/while}"),

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

    macro: ($) =>
      seq(
        field("open", $.macro_start),
        repeat($._node),
        field("close", $.macro_end),
      ),

    macro_start: (_) => token(seq("{macro", /[^}]*/, "}")),
    macro_end: (_) => token(seq("{/macro", /[^}]*/, "}")),

    macro_call: ($) =>
      seq(
        token(prec(-1, "{")),
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
