import React, {ChangeEvent, useCallback, useState} from "react"

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

const createImage = (ctx: CanvasRenderingContext2D, filter: Filter, options: FilterOptions) => {
  const colors: RGBColor[] = []
  const imageData = ctx.getImageData(0, 0, WIDTH, HEIGHT)
  for (let x = 0; x < WIDTH; x++) {
    for (let y = 0; y < HEIGHT; y++) {
      const index = (HEIGHT * y + x) << 2
      const colorIndex = filter(x,y,options)
      const color = getColor(colorIndex, colors)
      imageData.data[index] = color.r
      imageData.data[index + 1] = color.g
      imageData.data[index + 2] = color.b
      imageData.data[index + 3] = 255
    }
  }
  ctx.putImageData(imageData, 0, 0)
}

const useImage = (filter: Filter, options: FilterOptions) => {
  const ref = useCallback((canvas: HTMLCanvasElement) => {
    if (canvas) {
      const ctx = canvas.getContext("2d")
      if (ctx) createImage(ctx, filter, options)
    }
  }, [filter, options])
  return ref
}

const FilterImage: React.FC<{filter: Filter, options?: FilterOptions}> = ({filter, options}) => {
  const ref = useImage(filter, options || {})
  return (
    <div className="filter-image">
      <canvas ref={ref} width={WIDTH} height={HEIGHT}></canvas>
    </div>
  )
}

const MinMax: any = {
  phase: {min: 0, max: 360, step: 10}
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
      [optionKey]: e.target.value,
    })
  }, [options, optionKey, setOptions])
  return <div key={optionKey}>
    <label>{optionKey} ({options[optionKey as keyof FilterOptions]})</label>
    <input type="range" name={optionKey} value={options[optionKey as keyof FilterOptions]} min={min} max={max} step={step} onChange={onValueChange} />
  </div>
}

const SandboxFilters = () => {
  const [sandboxFilter, setSandboxFilter] = useState<keyof typeof Filters>("circles")
  const [toggle, setToggle] = useState(false)
  const [options, setOptions] = useState<FilterOptions>({
    number: 16,
    frequency: 0.2,
    amplitude: 5,
    phase: 0,
  })
  const onChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setSandboxFilter(e.target.value as keyof typeof Filters)
  }, [])
  return (
    <>
      <div className="group" onChange={onChange}>
        {Object.keys(Filters).map((key) => {
          return <div key={key} onClick={() => setSandboxFilter(key as keyof typeof Filters)}>
            <input type="radio" name="filter" value={key} checked={key === sandboxFilter} />
            <label>{key}</label>
          </div>
        })}
      </div>
      <div className="group">
        {Object.keys(options).map((key) => {
          return <Option key={key} optionKey={key as keyof FilterOptions} options={options} setOptions={setOptions} />
        })}
      </div>
      <FilterImage filter={Filters[sandboxFilter]} options={options} />
    </>
  )
}

type mode = "gallery" | "sandbox"

function App() {
  const [mode, setMode] = useState<mode>("gallery")
  const onChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setMode(e.target.value as mode)
  }, [])
  return (
    <div className="App">
      <div className="group" onChange={onChange}>
        <div onClick={() => setMode("gallery")}>
          <input type="radio" name="mode" value="gallery" checked={mode === "gallery"}/>
          <label>gallery</label>
        </div>
        <div onClick={() => setMode("sandbox")}>
          <input type="radio" name="mode" value="sandbox" checked={mode === "sandbox"} />
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
