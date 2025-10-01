; Latte bracket matching queries
; Define which opening and closing tags should be matched/highlighted together

; Block tags
(block
  open: (block_start) @open
  close: (block_end) @close)

; If/elseif/else blocks
(if_block
  open: (if_start) @open
  close: (if_end) @close)

; Foreach blocks
(foreach_block
  open: (foreach_start) @open
  close: (foreach_end) @close)

; For blocks
(for_block
  open: (for_start) @open
  close: (for_end) @close)

; While blocks
(while_block
  open: (while_start) @open
  close: (while_end) @close)

; Switch blocks
(switch_block
  open: (switch_start) @open
  close: (switch_end) @close)

; Macro blocks
(macro
  open: (macro_start) @open
  close: (macro_end) @close)

; General bracket pairs for expressions
["{" "}"] @bracket
["(" ")"] @bracket
["[" "]"] @bracket
