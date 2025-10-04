; inherits: html

; PHP content - unified injection for all PHP expressions
; This covers:
; - {$variable->property}
; - {= expression}
; - {var $x = value}
; - {if condition}, {foreach items}, {switch expr}, etc.
; - {macro arguments}
; - {include 'file', arguments}
; - {embed 'file', arguments}
; - Filter arguments: |filter:args
((php_only) @injection.content
 (#set! injection.include-children)
 (#set! injection.language "php_only"))

; N-attributes - Latte attributes in HTML tags (n:if, n:foreach, etc.)
; Inject PHP into the attribute values of any attribute starting with "n:"
(attribute
  (attribute_name) @_attr
  (#match? @_attr "^n:")
  (quoted_attribute_value
    (attribute_value) @injection.content)
  (#set! injection.language "php_only"))
