; Latte syntax highlighting queries
; Extends tree-sitter-html highlights

; Inherit HTML highlighting
(tag_name) @tag
(erroneous_end_tag_name) @tag.error
(doctype) @constant
(attribute_name) @attribute
(attribute_value) @string
(entity) @constant.character.escape

; HTML punctuation
[
  "<"
  ">"
  "</"
  "/>"
] @punctuation.bracket

; Latte comments
(comment) @comment

; Latte block constructs
(block_start) @keyword
(block_end) @keyword
(elseif_block) @keyword
(else_block) @keyword

; Latte macros
(macro) @keyword
(macro_name) @function.call
(macro_args) @none

; Latte expressions in attributes
(latte_expression) @variable

; Latte delimiters
[
  "{"
  "}"
] @punctuation.delimiter

; Text content
(text) @none
