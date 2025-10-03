; inherits: html

; Inject PHP into {php ...} blocks
; php_content is an aliased token containing raw PHP code
((php_block) @injection.content
 (#set! injection.language "php_only"))

; Inject PHP from php_only nodes (used in {$variable->property})
; This captures the variable content without the surrounding braces
((php_only) @injection.content
  (#set! injection.language "php_only"))

; Inject PHP into expressions (used in {= ... }, {var $x = ...}, etc.)
; This is more specific than php_variable since it covers all expression contexts
((latte_print_tag
  expression: (expression) @injection.content)
 (#set! injection.language "php_only"))

((latte_assignment_tag
  value: (expression) @injection.content)
 (#set! injection.language "php_only"))

; Inject PHP into latte_expression nodes in attributes
((latte_expression) @injection.content
 (#set! injection.language "php_only")
 (#set! injection.include-children))

; Inject PHP into macro arguments
((macro_arguments) @injection.content
 (#set! injection.language "php_only"))

; Inject PHP into filter arguments
((filter_args) @injection.content
 (#set! injection.language "php_only"))
