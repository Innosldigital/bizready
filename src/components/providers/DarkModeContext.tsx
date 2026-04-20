'use client'
import { createContext, useContext } from 'react'

export interface DarkModeContextType {
  isDark: boolean
  toggle: () => void
}

export const DarkModeContext = createContext<DarkModeContextType>({
  isDark: false,
  toggle: () => {},
})

export const useDarkMode = () => useContext(DarkModeContext)
