import React, {
  ChangeEvent,
  createContext,
  useCallback,
  useState,
  useEffect,
  useContext,
  MouseEventHandler,
} from "react"

import Filters, {
  mapFilters,
  Filter,
  WIDTH,
  HEIGHT,
  getColor,
  RGBColor,
  FilterOptions,
  lerpFilter,
} from "./filters"

import "./App.css"

type ColorContext = [RGBColor[], (colors: RGBColor[]) => void]

const ColorContext = createContext<ColorContext>([[], () => {}])

const useColors = () => {
  return useContext(ColorContext)
}

const createImage = (
  ctx: CanvasRenderingContext2D,
  filter: Filter,
  options: FilterOptions,
  inColors?: RGBColor[],
  lerp?: boolean,
) => {
  const imageData = ctx.getImageData(0, 0, WIDTH, HEIGHT)
  let newColors = inColors || []
  let color
  for (let x = 0; x < WIDTH; x++) {
    for (let y = 0; y < HEIGHT; y++) {
      const index = (HEIGHT * y + x) << 2
      const colorIndex = filter(x, y, options)
      ;[color, newColors] = lerp
        ? lerpFilter(x, y, options, filter, newColors)
        : getColor(colorIndex, newColors)
      imageData.data[index] = color.r
      imageData.data[index + 1] = color.g
      imageData.data[index + 2] = color.b
      imageData.data[index + 3] = 255
    }
  }
  ctx.putImageData(imageData, 0, 0)
  return newColors
}

const useImage = (
  filter: Filter,
  options: FilterOptions,
  redraw?: boolean,
  lerp?: boolean,
) => {
  const [colors, setColors] = useColors()
  const ref = useCallback(
    (canvas: HTMLCanvasElement) => {
      if (canvas) {
        const ctx = canvas.getContext("2d")
        if (ctx) {
          const newColors = createImage(ctx, filter, options, colors, lerp)
          setColors(newColors)
        }
      }
    },
    [filter, options, redraw],
  )
  return ref
}

const FilterImage: React.FC<{
  filter: Filter
  color?: string
  options?: FilterOptions
  redraw?: boolean
  lerp?: boolean
}> = ({ filter, color, options, redraw, lerp }) => {
  const [colors, setColors] = useColors()
  const ref = useImage(filter, options || {}, redraw, lerp)
  const findIndex: MouseEventHandler<HTMLCanvasElement> = useCallback(
    ({ clientX, clientY, currentTarget }) => {
      if (color) {
        const x = clientX - currentTarget.offsetLeft
        const y = clientY - currentTarget.offsetTop
        const index = Math.floor(filter(x, y, options || {}))
        const localColors = colors.concat()
        localColors[index] = RGBColor.fromHex(color)
        setColors(localColors)
      }
    },
    [colors, color],
  )
  return (
    <div className="filter-image">
      <canvas
        ref={ref}
        width={WIDTH}
        height={HEIGHT}
        onClick={findIndex}
      ></canvas>
    </div>
  )
}

interface Constraints {
  min: number
  max: number
  step: number
}

const MinMax: Record<string, Constraints> = {
  number: { min: 1, max: 100, step: 1 },
  phase: { min: 0, max: 360, step: 1 },
}

interface OriginInputProps {
  options: FilterOptions
  setOptions: (o: FilterOptions) => void
}

const OriginInput: React.FC<OriginInputProps> = ({ options, setOptions }) => {
  const { origin = { x: WIDTH / 2, y: HEIGHT / 2 } } = options
  const updateOrigin: MouseEventHandler<SVGSVGElement> = useCallback(
    ({ clientX, clientY, currentTarget }) => {
      const { x, y } = currentTarget.getBoundingClientRect()
      const cx = ((clientX - x) / 100) * WIDTH
      const cy = ((clientY - y) / 100) * WIDTH
      setOptions({ ...options, origin: { x: cx, y: cy } })
    },
    [options, setOptions],
  )
  const updateSliderY = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setOptions({
        ...options,
        origin: { ...origin, y: -parseInt(e.target.value) },
      })
    },
    [options, setOptions, origin],
  )
  const updateSliderX = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setOptions({
        ...options,
        origin: { ...origin, x: parseInt(e.target.value) },
      })
    },
    [options, setOptions, origin],
  )
  return (
    <table>
      <tbody>
        <tr>
          <td>
            <svg
              width="100"
              height="100"
              style={{ border: "1px solid black" }}
              onClick={updateOrigin}
            >
              <circle
                cx={(origin.x / WIDTH) * 100}
                cy={(origin.y / HEIGHT) * 100}
                r={10}
                fill="black"
              />
            </svg>
          </td>
          <td>
            <input
              type="range"
              style={{
                WebkitAppearance: "slider-vertical",
                height: 100,
                width: 20,
              }}
              min="-350"
              max="0"
              value={-origin.y}
              onChange={updateSliderY}
            />
          </td>
        </tr>
        <tr>
          <td>
            <input
              type="range"
              style={{
                height: 20,
                width: 100,
              }}
              min="0"
              max="350"
              value={origin.x}
              onChange={updateSliderX}
            />
          </td>
          <td></td>
        </tr>
      </tbody>
    </table>
  )
}

const isNumber = (val: FilterOptions[keyof FilterOptions]): val is number => {
  return typeof val === "number"
}

const Option: React.FC<{
  optionKey: keyof FilterOptions
  options: FilterOptions
  setOptions: (o: FilterOptions) => void
}> = ({ optionKey, options, setOptions }) => {
  const { min, max, step } = MinMax[optionKey] || { min: 0, max: 30, step: 1 }
  const onValueChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setOptions({
        ...options,
        [optionKey]: parseInt(e.target.value),
      })
    },
    [options, optionKey, setOptions],
  )
  const o = options[optionKey as keyof FilterOptions]
  return (
    <tr key={optionKey}>
      <td>
        <label>{optionKey}</label>
      </td>
      {isNumber(o) ? (
        <>
          <td>
            <input
              type="range"
              name={optionKey}
              value={o}
              min={min}
              max={max}
              step={step}
              onChange={onValueChange}
            />
          </td>
          <td>({options[optionKey as keyof FilterOptions]})</td>
        </>
      ) : (
        <td>
          <OriginInput options={options} setOptions={setOptions} />
        </td>
      )}
    </tr>
  )
}

const SandboxFilters = () => {
  const [sandboxFilter, setSandboxFilter] =
    useState<keyof typeof Filters>("wavyCircles")
  const colorState = useState<RGBColor[]>([])
  const [color, setColor] = useState("#000000")
  const [redraw, setRedraw] = useState(false)
  const [lerp, setLerp] = useState(false)
  const [options, setOptions] = useState<FilterOptions>({
    number: 16,
    frequency: 5,
    amplitude: 1,
    phase: 0,
    origin: {
      x: WIDTH / 2,
      y: HEIGHT / 2,
    },
  })
  const onChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setSandboxFilter(e.target.value as keyof typeof Filters)
  }, [])
  const onColorChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setColor(e.target.value)
    },
    [color],
  )
  useEffect(() => {
    const timeout = setTimeout(() => {
      setRedraw(!redraw)
    }, 1000 / 24)
    return () => {
      clearTimeout(timeout)
    }
  }, [redraw])
  return (
    <ColorContext.Provider value={colorState}>
      <div className="group">
        {Object.keys(Filters).map((key) => {
          return (
            <div
              key={key}
              onClick={() => setSandboxFilter(key as keyof typeof Filters)}
            >
              <input
                type="radio"
                name="filter"
                value={key}
                checked={key === sandboxFilter}
                onChange={onChange}
              />
              <label>{key}</label>
            </div>
          )
        })}
      </div>
      <table style={{ display: "block" }}>
        <tbody>
          {Object.keys(options).map((key) => {
            return (
              <Option
                key={key}
                optionKey={key as keyof FilterOptions}
                options={options}
                setOptions={setOptions}
              />
            )
          })}
          <tr>
            <td>Lerp:</td>
            <td>
              <input
                type="checkbox"
                checked={lerp}
                onChange={(e) => setLerp(e.target.checked)}
              />
            </td>
          </tr>
        </tbody>
      </table>
      <FilterImage
        filter={Filters[sandboxFilter]}
        options={options}
        redraw={redraw}
        color={color}
        lerp={lerp}
      />
      <div>
        <input type="color" value={color} onChange={onColorChange} />
      </div>
    </ColorContext.Provider>
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
          <input
            type="radio"
            name="mode"
            value="gallery"
            checked={mode === "gallery"}
            onChange={onChange}
          />
          <label>gallery</label>
        </div>
        <div onClick={() => setMode("sandbox")}>
          <input
            type="radio"
            name="mode"
            value="sandbox"
            checked={mode === "sandbox"}
            onChange={onChange}
          />
          <label>sandbox</label>
        </div>
      </div>
      {mode === "gallery" &&
        mapFilters((filter, index) => (
          <FilterImage key={index} filter={filter} options={{ number: 16 }} />
        ))}
      {mode === "gallery" &&
        mapFilters((filter, index) => (
          <FilterImage
            key={index}
            filter={filter}
            options={{ number: 16 }}
            lerp
          />
        ))}
      {mode === "sandbox" && <SandboxFilters />}
    </div>
  )
}

export default App
