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
(elseif_start) @keyword
(else_start) @keyword

; Latte macros
(macro) @keyword
(macro_name) @function.call
(macro_args) @parameter

; Latte variables and print tags
(variable_name) @variable

; Latte filters
(filter_name) @function.method
(filter_args) @parameter

; Latte expressions in attributes
(latte_expression) @variable

; Latte delimiters
[
  "{"
  "}"
  "{="
  "{$"
  "|"
] @punctuation.delimiter

; Text content
(text) @none
