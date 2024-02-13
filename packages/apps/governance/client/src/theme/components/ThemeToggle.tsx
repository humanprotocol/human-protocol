import { atom } from 'jotai'
import { atomWithStorage, useAtomValue, useUpdateAtom } from 'jotai/utils'
import { useCallback, useEffect, useMemo } from 'react'
import { addMediaQueryListener, removeMediaQueryListener } from 'utils/matchMedia'

const DARKMODE_MEDIA_QUERY = window.matchMedia('(prefers-color-scheme: dark)')

export enum ThemeMode {
  LIGHT,
  DARK,
  AUTO,
}

// Tracks the device theme
const systemThemeAtom = atom<ThemeMode.LIGHT | ThemeMode.DARK>(
  DARKMODE_MEDIA_QUERY.matches ? ThemeMode.DARK : ThemeMode.LIGHT
)

// Tracks the user's selected theme mode
const themeModeAtom = atomWithStorage<ThemeMode>('interface_color_theme', ThemeMode.LIGHT)

export function SystemThemeUpdater() {
  const setSystemTheme = useUpdateAtom(systemThemeAtom)

  const listener = useCallback(
    (event: MediaQueryListEvent) => {
      setSystemTheme(event.matches ? ThemeMode.DARK : ThemeMode.LIGHT)
    },
    [setSystemTheme]
  )

  useEffect(() => {
    addMediaQueryListener(DARKMODE_MEDIA_QUERY, listener)
    return () => removeMediaQueryListener(DARKMODE_MEDIA_QUERY, listener)
  }, [setSystemTheme, listener])

  return null
}

export function useIsDarkMode(): boolean {
  const mode = useAtomValue(themeModeAtom)
  const systemTheme = useAtomValue(systemThemeAtom)

  return (mode === ThemeMode.AUTO ? systemTheme : mode) === ThemeMode.DARK
}

export function useDarkModeManager(): [boolean, (mode: ThemeMode) => void] {
  const isDarkMode = useIsDarkMode()
  const setMode = useUpdateAtom(themeModeAtom)

  return useMemo(() => {
    return [isDarkMode, setMode]
  }, [isDarkMode, setMode])
}
