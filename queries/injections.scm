; inherits: html

; PHP blocks - raw PHP code in {php ...} tags
((php_block) @injection.content
 (#set! injection.language "php_only"))

; PHP variables - {$variable->property}
((php_only) @injection.content
  (#set! injection.language "php_only"))

; PHP expressions in print and assignment tags
((latte_print_tag
  expression: (expression) @injection.content)
 (#set! injection.language "php_only"))

((latte_assignment_tag
  value: (expression) @injection.content)
 (#set! injection.language "php_only"))

; Control flow tags - PHP conditions and expressions
; {if $x}, {elseif $y}, {while $z}, {switch $status}, {case $value}
((if_start) @injection.content
 (#set! injection.language "php_only"))

((elseif_start) @injection.content
 (#set! injection.language "php_only"))

((while_start) @injection.content
 (#set! injection.language "php_only"))

((switch_start) @injection.content
 (#set! injection.language "php_only"))

((case_start) @injection.content
 (#set! injection.language "php_only"))

; Loop tags - PHP expressions
; {for $i = 0; $i < 10; $i++}, {foreach $items as $item}
((for_start) @injection.content
 (#set! injection.language "php_only"))

((foreach_start) @injection.content
 (#set! injection.language "php_only"))

; Latte expressions in HTML attributes
((latte_expression) @injection.content
 (#set! injection.language "php_only")
 (#set! injection.include-children))

; Arguments - PHP expressions in macro/file/filter arguments
((macro_arguments) @injection.content
 (#set! injection.language "php_only"))

((file_tag_arguments) @injection.content
 (#set! injection.language "php_only"))

((filter_args) @injection.content
 (#set! injection.language "php_only"))
