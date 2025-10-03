; inherits: html

; Latte comments
(comment) @comment

; Latte blocks - control flow blocks
(if_block) @keyword.control
(loop_block) @keyword.control
(switch_block) @keyword.control
(block) @keyword.control

; Note: PHP expressions inside control flow tags {if $var}, {foreach $items}, {while $x}, etc.
; are tokenized in the grammar and highlighted via PHP injection queries (see injections.scm)

; Latte print tags - highlight differently from variables
(latte_print_tag) @tag.builtin

; Latte variables - inside {$var}
(latte_variable) @variable.member

; PHP variables - both in {$var} context and in expressions
(php_only
  "$" @punctuation.special
  name: (identifier) @variable.builtin)

(php_variable
  "$" @punctuation.special
  name: (identifier) @variable.builtin)

; Latte special tags
(latte_assignment_tag) @keyword.directive
(var_type_tag) @keyword.type
(template_type_tag) @keyword.type
(capture_tag) @keyword.directive
(embed_tag) @keyword.directive

; File-related tags with structured highlighting
(latte_file_tag
  tag_name: (file_tag_name) @keyword.directive)

(file_path
  (string_literal) @string.special.path)

; Macro calls - {CustomTag args}
(macro_call
  name: (macro_name) @function.macro
  arguments: (macro_arguments)? @parameter)

; Latte filters - highlight the pipe and filter name
(filter_chain
  (filter
    "|" @operator
    filter_name: (filter_name) @function.method
    filter_args: (filter_args)? @parameter))

; Literals
(string_literal) @string
(number_literal) @number
(boolean_literal) @boolean
(null_literal) @constant.builtin

; Latte expressions in attributes
(latte_expression) @embedded

; Latte delimiters - make them stand out
"{=" @punctuation.special

[
  "{"
  "}"
] @punctuation.bracket

"|" @operator

; Text content
(text) @none
