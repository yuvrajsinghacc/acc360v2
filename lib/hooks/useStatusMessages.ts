import { useState, useEffect } from 'react'

const STATUS_MESSAGES = [
  'Searching the universe…',
  'Consulting the oracle…',
  'Reading the tea leaves…',
  'Crunching the numbers…',
  'Connecting the dots…',
  'Searching the web…',
]

/**
 * Returns a rotating status string while `active` is true.
 * Cycles through STATUS_MESSAGES every 2 seconds.
 */
export function useStatusMessages(active: boolean): string {
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    if (!active) return
    const id = setInterval(() => setIdx((i) => (i + 1) % STATUS_MESSAGES.length), 2000)
    return () => clearInterval(id)
  }, [active])

  return STATUS_MESSAGES[idx]
}
