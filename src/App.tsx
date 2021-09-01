import React, {ChangeEvent, useCallback, useState, useEffect} from "react"

import Filters, {
  mapFilters,
  Filter,
  WIDTH,
  HEIGHT,
  getColor,
  RGBColor,
  FilterOptions,
} from "./filters"
import "./App.css"

const createImage = (ctx: CanvasRenderingContext2D, filter: Filter, options: FilterOptions, inColors?: RGBColor[]) => {
  const imageData = ctx.getImageData(0, 0, WIDTH, HEIGHT)
  for (let x = 0; x < WIDTH; x++) {
    for (let y = 0; y < HEIGHT; y++) {
      const index = (HEIGHT * y + x) << 2
      const colorIndex = filter(x, y, options)
      const color = getColor(colorIndex, inColors || [])
      imageData.data[index] = color.r
      imageData.data[index + 1] = color.g
      imageData.data[index + 2] = color.b
      imageData.data[index + 3] = 255
    }
  }
  ctx.putImageData(imageData, 0, 0)
}

type ColorState = [RGBColor[], (c: RGBColor[]) => void]

const useImage = (filter: Filter, options: FilterOptions, inColorState?: ColorState, redraw?: boolean) => {
  const localColorState = useState<RGBColor[]>([])
  const [colors, setColors] = inColorState || localColorState
  const ref = useCallback((canvas: HTMLCanvasElement) => {
    if (canvas) {
      const ctx = canvas.getContext("2d")
      const localColors = colors.concat()
      if (ctx) createImage(ctx, filter, options, localColors)
      setColors(localColors)
    }
  }, [filter, options, redraw])
  return ref
}

const FilterImage: React.FC<{filter: Filter, options?: FilterOptions, colorState?: ColorState, redraw?: boolean}> = ({filter, options, colorState, redraw}) => {
  const ref = useImage(filter, options || {}, colorState, redraw)
  return (
    <div className="filter-image">
      <canvas ref={ref} width={WIDTH} height={HEIGHT}></canvas>
    </div>
  )
}

interface Constraints {
  min: number
  max: number
  step: number
}

const MinMax: Record<string, Constraints> = {
  number: {min: 1, max: 100, step: 1},
  phase: {min: 0, max: 360, step: 1},
}

const Option: React.FC<{
  optionKey: keyof FilterOptions,
  options: FilterOptions,
  setOptions: (o: FilterOptions) => void,
}> = ({optionKey, options, setOptions}) => {
  const {min, max, step} = MinMax[optionKey] || {min: 0, max: 30, step: 1}
  const onValueChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setOptions({
      ...options,
      [optionKey]: parseInt(e.target.value),
    })
  }, [options, optionKey, setOptions])
  return <tr key={optionKey}>
    <td><label>{optionKey}</label></td>
    <td><input type="range" name={optionKey} value={options[optionKey as keyof FilterOptions]} min={min} max={max} step={step} onChange={onValueChange} /></td>
    <td>({options[optionKey as keyof FilterOptions]})</td>
  </tr>
}

const SandboxFilters = () => {
  const [sandboxFilter, setSandboxFilter] = useState<keyof typeof Filters>("circles")
  const colorState = useState<RGBColor[]>([])
  const [redraw, setRedraw] = useState(false)
  const [colors, setColors] = colorState
  const [options, setOptions] = useState<FilterOptions>({
    number: 16,
    frequency: 5,
    amplitude: 0.2,
    phase: 0,
  })
  const onChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setSandboxFilter(e.target.value as keyof typeof Filters)
  }, [])
  const onColorChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const index = parseInt(e.target.name)
    const newColors = colors.concat()
    newColors[index] = RGBColor.fromHex(e.target.value)
    setColors(newColors)
  }, [colors])
  useEffect(() => {
    const timeout = setTimeout(() => {
      setRedraw(!redraw)
    }, 1000 / 1)
    return () => {
      clearTimeout(timeout)
    }
  }, [redraw])
  return (
    <>
      <div className="group">
        {Object.keys(Filters).map((key) => {
          return <div key={key} onClick={() => setSandboxFilter(key as keyof typeof Filters)}>
            <input type="radio" name="filter" value={key} checked={key === sandboxFilter} onChange={onChange} />
            <label>{key}</label>
          </div>
        })}
      </div>
      <table style={{display: "block"}}>
        <tbody>
          {Object.keys(options).map((key) => {
            return <Option key={key} optionKey={key as keyof FilterOptions} options={options} setOptions={setOptions} />
          })}
        </tbody>
      </table>
      <FilterImage filter={Filters[sandboxFilter]} options={options} colorState={colorState} redraw={redraw}/>
      <div>
        {colors.map((color: RGBColor, index: number) => {
          return <input key={index} type="color" value={color.toString()} onChange={onColorChange} name={index.toString()} />
        })}
      </div>
    </>
  )
}

type mode = "gallery" | "sandbox"

function App() {
  const [mode, setMode] = useState<mode>("sandbox")
  const onChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setMode(e.target.value as mode)
  }, [])
  return (
    <div className="App">
      <div className="group">
        <div onClick={() => setMode("gallery")}>
          <input type="radio" name="mode" value="gallery" checked={mode === "gallery"} onChange={onChange} />
          <label>gallery</label>
        </div>
        <div onClick={() => setMode("sandbox")}>
          <input type="radio" name="mode" value="sandbox" checked={mode === "sandbox"} onChange={onChange} />
          <label>sandbox</label>
        </div>
      </div>
      {mode === "gallery" && mapFilters(
        (filter, index) => (
          <FilterImage key={index} filter={filter} options={{number: 16}} />
        )
      )}
      {mode === "sandbox" && (
        <SandboxFilters />
      )}
    </div>
  );
}

export default App;
