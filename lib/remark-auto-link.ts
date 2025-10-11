import { visit } from 'unist-util-visit'
import type { Node, Parent } from 'unist'
import type { Text, Link } from 'mdast'

interface TextNode extends Text {
  type: 'text'
}

interface LinkNode extends Link {
  type: 'link'
}

// Email regex pattern
const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g

// Phone regex patterns for various formats
const PHONE_PATTERNS = [
  // US/Canada format: (123) 456-7890, 123-456-7890, 123.456.7890, 123 456 7890
  /\b(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})\b/g,
  // International format: +1 234 567 8900, +44 20 7123 4567
  /\+[0-9]{1,3}[-.\s]?(?:\([0-9]{1,4}\)|[0-9]{1,4})[-.\s]?[0-9]{1,4}[-.\s]?[0-9]{1,4}[-.\s]?[0-9]{1,9}/g,
  // Simple format: 1234567890 (10 digits)
  /\b(?<![\d-])(?:\+?1[-.\s]?)?([0-9]{10})\b/g,
]

function createLinkNode(url: string, value: string): LinkNode {
  return {
    type: 'link',
    url,
    title: null,
    children: [{ type: 'text', value }],
  }
}

function processTextForLinks(text: string): (TextNode | LinkNode)[] {
  const nodes: (TextNode | LinkNode)[] = []
  let lastIndex = 0
  const matches: Array<{ start: number; end: number; value: string; type: 'email' | 'phone' }> = []

  // Find all email matches
  let emailMatch
  EMAIL_REGEX.lastIndex = 0
  while ((emailMatch = EMAIL_REGEX.exec(text)) !== null) {
    matches.push({
      start: emailMatch.index,
      end: emailMatch.index + emailMatch[0].length,
      value: emailMatch[0],
      type: 'email',
    })
  }

  // Find all phone matches
  PHONE_PATTERNS.forEach(pattern => {
    pattern.lastIndex = 0
    let phoneMatch
    while ((phoneMatch = pattern.exec(text)) !== null) {
      // Avoid overlapping matches
      const start = phoneMatch.index
      const end = phoneMatch.index + phoneMatch[0].length
      const overlaps = matches.some(m => 
        (start >= m.start && start < m.end) || 
        (end > m.start && end <= m.end)
      )
      
      if (!overlaps) {
        matches.push({
          start,
          end,
          value: phoneMatch[0],
          type: 'phone',
        })
      }
    }
  })

  // Sort matches by position
  matches.sort((a, b) => a.start - b.start)

  // Create nodes
  matches.forEach(match => {
    // Add text before the match
    if (match.start > lastIndex) {
      nodes.push({
        type: 'text',
        value: text.slice(lastIndex, match.start),
      })
    }

    // Add the link
    if (match.type === 'email') {
      nodes.push(createLinkNode(`mailto:${match.value}`, match.value))
    } else {
      // Clean phone number for tel: link (remove all non-digits except +)
      const cleanPhone = match.value.replace(/[^\d+]/g, '')
      nodes.push(createLinkNode(`tel:${cleanPhone}`, match.value))
    }

    lastIndex = match.end
  })

  // Add remaining text
  if (lastIndex < text.length) {
    nodes.push({
      type: 'text',
      value: text.slice(lastIndex),
    })
  }

  return nodes.length > 0 ? nodes : [{ type: 'text', value: text }]
}

export function remarkAutoLink() {
  return (tree: Node) => {
    visit(tree, 'text', (node: TextNode, index: number | null, parent: Parent | null) => {
      if (!parent || index === null) return

      // Skip if already inside a link
      if (parent.type === 'link') return

      const newNodes = processTextForLinks(node.value)
      
      // Replace the text node with new nodes only if links were found
      if (newNodes.length > 1) {
        parent.children.splice(index, 1, ...newNodes)
        return index + newNodes.length
      }
    })
  }
}