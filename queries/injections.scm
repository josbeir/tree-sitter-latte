; inherits: html

; PHP content - unified injection for all PHP expressions
; This covers:
; - {$variable->property}
; - {= expression}
; - {var $x = value}
; - {if condition}, {foreach items}, {switch expr}, etc.
; - {macro arguments}
; - {include 'file', arguments}
; - Filter arguments: |filter:args
((php_only) @injection.content
 (#set! injection.language "php_only"))
