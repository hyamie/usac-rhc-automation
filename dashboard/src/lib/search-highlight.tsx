import React from 'react'

/**
 * Highlights search terms in text
 * @param text - The text to search within
 * @param searchTerm - The term to highlight
 * @returns React elements with highlighted terms
 */
export function highlightSearchTerm(text: string, searchTerm: string): React.ReactNode {
  if (!searchTerm || !text) {
    return text
  }

  const parts = text.split(new RegExp(`(${searchTerm})`, 'gi'))

  return parts.map((part, index) =>
    part.toLowerCase() === searchTerm.toLowerCase() ? (
      <mark
        key={index}
        className="bg-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-100 px-0.5 rounded font-medium animate-highlight"
      >
        {part}
      </mark>
    ) : (
      <span key={index}>{part}</span>
    )
  )
}

/**
 * Creates a text snippet with context around the search term
 * @param text - The full text
 * @param searchTerm - The term to find
 * @param contextLength - Number of characters to show on each side
 * @returns Snippet with ellipsis
 */
export function createSearchSnippet(
  text: string,
  searchTerm: string,
  contextLength: number = 50
): string {
  if (!searchTerm || !text) {
    return text.slice(0, contextLength * 2) + (text.length > contextLength * 2 ? '...' : '')
  }

  const index = text.toLowerCase().indexOf(searchTerm.toLowerCase())

  if (index === -1) {
    return text.slice(0, contextLength * 2) + (text.length > contextLength * 2 ? '...' : '')
  }

  const start = Math.max(0, index - contextLength)
  const end = Math.min(text.length, index + searchTerm.length + contextLength)

  let snippet = text.slice(start, end)

  if (start > 0) {
    snippet = '...' + snippet
  }

  if (end < text.length) {
    snippet = snippet + '...'
  }

  return snippet
}

/**
 * Calculates relevance score for search results
 * @param item - The item to score
 * @param searchTerm - The search term
 * @param fields - Fields to search in
 * @returns Relevance score (0-100)
 */
export function calculateRelevanceScore(
  item: any,
  searchTerm: string,
  fields: string[]
): number {
  if (!searchTerm) return 0

  let score = 0
  const term = searchTerm.toLowerCase()

  fields.forEach((field) => {
    const value = String(item[field] || '').toLowerCase()

    // Exact match in field (highest score)
    if (value === term) {
      score += 100
    }
    // Starts with search term
    else if (value.startsWith(term)) {
      score += 75
    }
    // Contains search term
    else if (value.includes(term)) {
      score += 50
    }
    // Fuzzy match (contains individual words)
    else {
      const words = term.split(' ')
      const matchedWords = words.filter(word => value.includes(word))
      score += (matchedWords.length / words.length) * 25
    }
  })

  return Math.min(100, score)
}
