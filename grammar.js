/**
 * @file Latte template support
 * @author josbeir <josbeir@gmail.com>
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

const htmlGrammar = require('./vendor/tree-sitter-html/grammar');

module.exports = grammar(htmlGrammar, {
  name: "latte",
  extras: $ => [/\s+/],
     conflicts: $ => [
     [$.latte_open_tag, $.latte_self_closing_tag],
     [$.if_tag, $.else_tag],
     [$.foreach_tag, $.else_tag],
     [$._node, $.if_tag],
     [$._node, $.foreach_tag],
     [$.source_file, $.if_tag, $.foreach_tag, $.block_tag],
     [$._node, $.if_tag, $.foreach_tag],
     [$.if_tag, $.foreach_tag, $.block_tag],
     // Removed _block_content conflicts
    ],

   rules: { // latte_body and _block_content removed, use repeat($._node) for block content
    source_file: $ => repeat($._node),
    // latte_body removed: use repeat($._node) directly for block content
    // if_else_block removed; else_tag now has body field

     _node: $ => choice(
       $.latte_print_tag,
       $.if_tag,
       $.foreach_tag,
       $.block_tag,
       $.varType_tag,
       $.templateType_tag,
       $.include_tag,
       $.latte_comment,
       $.latte_translation_tag,
       $.latte_literal_brace,
       $.html_content
     ), // main repeatable content unit, used for all block content

    else_tag: $ => prec.right(seq(
  token(seq('{else', optional(seq(' ', /[^}\n]*/)), '}')),
  field('body', repeat1($._node))
)),

    // Print tags: {=expr}
    latte_print_tag: $ => seq(
      '{=',
      field('expression', /[^}]+/),
      '}',
      
    ),

    // Pair tags: {if}...{/if}, {foreach}...{/foreach}, {block}...{/block}, etc.
    // _block_content removed: use $._node directly for block content
    if_tag: $ => prec.right(seq(
      token(seq('{', 'if', optional(seq(' ', /[^}\n]*/)), '}')),
      repeat($._node),
      optional($.else_tag),
      token(seq('{/', 'if', optional(seq(' ', /[^}\n]*/)), '}'))
    )),



    foreach_tag: $ => prec.right(seq(
      token(seq('{', 'foreach', optional(seq(' ', /[^}\n]*/)), '}')),
      field('body', repeat($._node)),
      optional(seq($.else_tag, field('alternative', repeat($._node)))),
      token(seq('{/', 'foreach', optional(seq(' ', /[^}\n]*/)), '}'))
    )),
    block_tag: $ => prec.right(seq(
      token(seq('{', 'block', optional(seq(' ', /[^}\n]*/)), '}')),
      field('body', repeat($._node)),
      token(seq('{/', 'block', optional(seq(' ', /[^}\n]*/)), '}'))
    )),



    // Fallback for other pair tags
    latte_pair_tag: $ => seq(
      alias($.latte_open_tag, $.open_tag),
      repeat($._node),
      optional(seq(alias($.latte_else_tag, $.latte_else_tag), repeat($._node))),
      alias($.latte_close_tag, $.close_tag)
    ),
    if_open_tag: $ => token(seq('{', 'if', optional(seq(' ', /[^}\n]*/)), '}')),
    if_close_tag: $ => token(seq('{/', 'if', optional(seq(' ', /[^}\n]*/)), '}')),
    foreach_open_tag: $ => token(seq('{', 'foreach', optional(seq(' ', /[^}\n]*/)), '}')),
    foreach_close_tag: $ => token(seq('{/', 'foreach', optional(seq(' ', /[^}\n]*/)), '}')),
    block_open_tag: $ => token(seq('{', 'block', optional(seq(' ', /[^}\n]*/)), '}')),
    block_close_tag: $ => token(seq('{/', 'block', optional(seq(' ', /[^}\n]*/)), '}')),

     // Self-closing tags: {varType ...}, {templateType ...}, {include ...}
     varType_tag: $ => seq('{', 'varType', optional(seq(' ', /[^}\n]*/)), '}'),
     templateType_tag: $ => seq('{', 'templateType', optional(seq(' ', /[^}\n]*/)), '}', ),
     include_tag: $ => seq('{', 'include', optional(seq(' ', /[^}\n]*/)), '}', ),

     latte_open_tag: $ => seq(
       '{',
       /[a-zA-Z_][a-zA-Z0-9_]*/, // tag name
       optional(seq(' ', /[^}\n]*/)),
       '}'
     ),
     latte_close_tag: $ => seq(
       '{/',
       /[a-zA-Z_][a-zA-Z0-9_]*/, // tag name
       optional(seq(' ', /[^}\n]*/)),
       '}'
     ),
    latte_else_tag: $ => seq(
      '{else',
      optional(seq(' ', /[^}\n]*/)),
      '}'
    ),

    // Self-closing tags: {varType ...}, {templateType ...}, {include ...}
    latte_self_closing_tag: $ => seq('{', /[a-zA-Z_][a-zA-Z0-9_]*/, optional(seq(' ', /[^}\n]*/)), '}'),

    // Latte comments: {* ... *}
    latte_comment: $ => seq(
      '{*',
      field('content', /[^*]*(\*+[^*}{][^*]*)*/),
      '*}',
      
    ),

    // Translation tags: {_...}, {translate}...{/translate}
    latte_translation_tag: $ => choice(
      seq('{_', field('key', /[^}\n]*/), '}', ),
      seq(
        alias('{translate}', $.latte_translation_tag),
        repeat($._node),
        alias('{/translate}', $.latte_translation_tag)
      )
    ),

    // Literal braces: {l}, {r}
    latte_literal_brace: $ => token(choice('{l}', '{r}')),

    // Fallback: HTML content (anything not matched by above)
    html_content: $ => token(prec(-1, /[^{}\s][^{}\n]*/))
  }
});
