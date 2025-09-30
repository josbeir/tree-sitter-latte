; Latte injection queries
; Injects JavaScript and CSS into script and style elements

; Inject JavaScript into script elements
((script_element
  (raw_text) @injection.content)
 (#set! injection.language "javascript"))

; Inject CSS into style elements
((style_element
  (raw_text) @injection.content)
 (#set! injection.language "css"))
