; inherits: html

; Latte comments
(comment) @comment

; Latte blocks - these are token nodes, so we can't drill into their contents
; but we can highlight the entire node with a specific scope
(if_block) @keyword.control
(loop_block) @keyword.control
(switch_block) @keyword.control
(block) @keyword.control

; Note: Variables inside {if $var}, {foreach $items}, {switch $status} etc.
; are consumed as tokens and cannot be individually highlighted without
; restructuring the grammar to parse their contents (which would impact performance)

; Latte print tags - highlight differently from variables
(latte_print_tag) @tag.builtin

; Latte variables - inside {$var}
(latte_variable) @variable.member

; PHP content in {$var} - highlight the php_only node
(php_only
  "$" @punctuation.special
  name: (identifier) @variable.builtin)

; PHP variables inside expressions (in tags like {var $x = ...})
(php_variable
  "$" @punctuation.special
  name: (identifier) @variable.builtin)

; Latte special tags
(latte_assignment_tag) @keyword.directive
(var_type_tag) @keyword.type
(template_type_tag) @keyword.type
(capture_tag) @keyword.directive
(latte_file_tag) @keyword.directive
(embed_tag) @keyword.directive
(latte_single_tag) @keyword.directive

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

; Latte functions and calls
(function_call
  function: (identifier) @function.call)

(static_call
  class: (identifier) @type
  "::" @punctuation.delimiter
  constant: (identifier)? @constant
  method: (identifier)? @function.method)

; Operators in expressions
(binary_expression
  operator: _ @operator)

(unary_expression
  operator: _ @operator)

(ternary_expression
  ["?" ":"] @operator)

; String and number literals
(string_literal) @string
(number_literal) @number
(boolean_literal) @boolean
(null_literal) @constant.builtin

; Identifiers in different contexts
(php_variable
  name: (identifier) @variable.builtin)

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
