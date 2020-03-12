import React from 'react'

export interface ITimeSliderContext {
  display: boolean
  play: boolean
  minSliderValue: number
  maxSliderValue: number
  rangeYearMin: number
  rangeYearMax: number
  mapDisplayYear: number
}

export interface ITimeSliderProviderProps {
  children: React.ReactNode
}

export const defaultTimeSliderProps = {
  display: false,
  play: false,
  minSliderValue: 1981,
  maxSliderValue: new Date().getFullYear(),
  rangeYearMin: 2000,
  rangeYearMax: 2010,
  mapDisplayYear: 2005,
}

export const TimeSliderContext = React.createContext<[ITimeSliderContext, (newState: Partial<ITimeSliderContext>) => void]>([defaultTimeSliderProps, () => {}])