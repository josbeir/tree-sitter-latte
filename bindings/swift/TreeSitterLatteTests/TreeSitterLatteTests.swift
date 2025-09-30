import XCTest
import SwiftTreeSitter
import TreeSitterLatte

final class TreeSitterLatteTests: XCTestCase {
    func testCanLoadGrammar() throws {
        let parser = Parser()
        let language = Language(language: tree_sitter_latte())
        XCTAssertNoThrow(try parser.setLanguage(language),
                         "Error loading Latte grammar")
    }
}
