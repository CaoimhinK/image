import React, { createContext, PropsWithChildren, useContext, useState } from "react"
import { RGBColor } from "./utils"

type ColorContext = [RGBColor[], (colors: RGBColor[]) => void]

const ColorContext = createContext<ColorContext>([[], () => {}])

export const useColors = () => {
  return useContext(ColorContext)
}

export const ColorProvider = ({ children }: PropsWithChildren<{}>) => {
  const colorState = useState<RGBColor[]>([])
  
  return (
    <ColorContext.Provider value={colorState}>{children}</ColorContext.Provider>
  )
}
