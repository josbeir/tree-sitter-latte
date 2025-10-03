; inherits: html

; Inject PHP from php_only nodes (used in {$variable})
((php_only) @injection.content
  (#set! injection.language "php_only"))

; Inject PHP into latte_expression nodes in attributes
((latte_expression) @injection.content
 (#set! injection.language "php_only")
 (#set! injection.include-children))

; Inject PHP into expressions
((expression) @injection.content
 (#set! injection.language "php_only")
 (#set! injection.include-children))

; Inject PHP into php_variable nodes (used in {var $x = 'value'})
((php_variable) @injection.content
 (#set! injection.language "php_only")
 (#set! injection.include-children))

; Inject PHP into macro arguments
((macro_arguments) @injection.content
 (#set! injection.language "php_only"))

; Inject PHP into filter arguments
((filter_args) @injection.content
 (#set! injection.language "php_only"))
