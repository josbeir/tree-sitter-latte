; inherits: html

; Latte injection queries
; Extends HTML injection with Latte-specific contexts

; Inject PHP into latte_expression nodes in attributes
((latte_expression) @injection.content
 (#set! injection.language "php_only")
 (#set! injection.include-children))

; Inject PHP into expressions
((expression) @injection.content
 (#set! injection.language "php_only")
 (#set! injection.include-children))
