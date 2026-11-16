import { create } from 'zustand'
import { useStore } from '../store'

// Overlay for the game closet: comics + board games vs the computer.
// While it's open the room is "unlocked" so WASD/E/F don't fire underneath.
export type TableTab = 'comics' | 'ttt' | 'c4' | 'checkers'

export const useTable = create<{ open: TableTab | null }>(() => ({ open: null }))

export function openTable(tab: TableTab = 'comics') {
  document.exitPointerLock()
  useStore.setState({ locked: false })
  useTable.setState({ open: tab })
}

export function closeTable() {
  useTable.setState({ open: null })
  useStore.setState({ locked: true })
}
