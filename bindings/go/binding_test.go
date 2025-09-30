package tree_sitter_latte_test

import (
	"testing"

	tree_sitter "github.com/tree-sitter/go-tree-sitter"
	tree_sitter_latte "github.com/tree-sitter/tree-sitter-latte/bindings/go"
)

func TestCanLoadGrammar(t *testing.T) {
	language := tree_sitter.NewLanguage(tree_sitter_latte.Language())
	if language == nil {
		t.Errorf("Error loading Latte grammar")
	}
}
