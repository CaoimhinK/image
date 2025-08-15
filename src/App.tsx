import React, {
  ChangeEvent,
  useCallback,
  useState,
  useEffect,
  MouseEventHandler,
} from "react"

import {
  mapFilters,
  FILTERS,
  type Filter,
  WIDTH,
  HEIGHT,
  lerpFilter,
} from "./filters"

import "./App.css"
import { getColor, RGBColor } from "./utils"
import { ColorProvider, useColors } from "./context"

const createImage = <O extends object>(
  ctx: CanvasRenderingContext2D,
  filter: Filter,
  options: O,
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

const useImage = <O extends object>(
  filter: Filter,
  options: O,
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

interface FilterImageProps<O extends object> {
  filter: Filter
  color?: string
  options?: O
  redraw?: boolean
  lerp?: boolean
}

const FilterImage = <O extends object>({
  filter,
  color,
  options,
  redraw,
  lerp,
}: FilterImageProps<O>) => {
  const [colors, setColors] = useColors()
  const ref = useImage(filter, options ?? {}, redraw, lerp)
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

const MinMax = {
  number: { min: 1, max: 100, step: 1 },
  phase: { min: 0, max: 360, step: 1 },
} as const satisfies Record<string, Constraints>

interface OriginInputProps<O extends object> {
  options: O
  setOptions: (o: O) => void
}

const OriginInput = <O extends { origin?: { x: number; y: number } }>({
  options,
  setOptions,
}: OriginInputProps<O>) => {
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

const isNumber = (val: unknown): val is number => {
  return typeof val === "number"
}

const isMinMaxKey = (key: string): key is MinMaxKey => {
  return Object.keys(MinMax).some((k) => k === key)
}

type MinMaxKey = keyof typeof MinMax

type WithMinMaxKeys = { [Key in MinMaxKey]?: unknown }
type WithOrigin = { origin?: { x: number; y: number } }

interface OptionProps<K extends string, O = Record<K, unknown>> {
  optionKey: K
  options: O
  setOptions: (o: O) => void
}

const Option = <K extends keyof (WithMinMaxKeys & WithOrigin) | string>({
  optionKey,
  options,
  setOptions,
}: OptionProps<K>) => {
  const { min, max, step } = isMinMaxKey(optionKey)
    ? MinMax[optionKey]
    : { min: 0, max: 30, step: 1 }
  const onValueChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setOptions({
        ...options,
        [optionKey]: parseInt(e.target.value),
      })
    },
    [options, optionKey, setOptions],
  )
  const o = options[optionKey]
  return (
    <tr key={optionKey.toString()}>
      <td>
        <label>{optionKey}</label>
      </td>
      {isNumber(o) ? (
        <>
          <td>
            <input
              type="range"
              name={optionKey.toString()}
              value={o}
              min={min}
              max={max}
              step={step}
              onChange={onValueChange}
            />
          </td>
          <td>{o}</td>
        </>
      ) : (
        <td>
          <OriginInput options={options} setOptions={setOptions} />
        </td>
      )}
    </tr>
  )
}

const keys = <Key extends string>(obj: Record<Key, unknown>) =>
  Object.keys(obj) as Key[]

const SandboxFilters = () => {
  const [sandboxFilter, setSandboxFilter] =
    useState<keyof typeof FILTERS>("wavyCircles")
  const [color, setColor] = useState("#000000")
  const [redraw, setRedraw] = useState(false)
  const [lerp, setLerp] = useState(false)
  const [options, setOptions] = useState<Record<string, unknown>>({
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
    setSandboxFilter(e.target.value as keyof typeof FILTERS)
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
    <ColorProvider>
      <div className="group">
        {keys(FILTERS).map((key) => {
          return (
            <div
              key={key}
              onClick={() => setSandboxFilter(key as keyof typeof FILTERS)}
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
          {keys(options).map((key) => {
            return (
              <Option
                key={key}
                optionKey={key}
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
        filter={FILTERS[sandboxFilter]}
        options={options}
        redraw={redraw}
        color={color}
        lerp={lerp}
      />
      <div>
        <input type="color" value={color} onChange={onColorChange} />
      </div>
    </ColorProvider>
  )
}

type Mode = "gallery" | "sandbox"

interface ModeGroupProps {
  mode: Mode
  onChangeMode: (mode: Mode) => void
}

const isMode = (value: string): value is Mode => {
  return value === "gallery" || value === "sandbox"
}

const ModeGroup = ({ mode, onChangeMode }: ModeGroupProps) => {
  const onChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value
      if (isMode(val)) {
        onChangeMode(val)
      }
    },
    [onChangeMode],
  )

  const setGallery = useCallback(() => {
    onChangeMode("gallery")
  }, [onChangeMode])

  const setSandbox = useCallback(() => {
    onChangeMode("sandbox")
  }, [onChangeMode])

  return (
    <div className="group">
      <div onClick={setGallery}>
        <input
          type="radio"
          name="mode"
          value="gallery"
          checked={mode === "gallery"}
          onChange={onChange}
        />
        <label>gallery</label>
      </div>
      <div onClick={setSandbox}>
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
  )
}

const Gallery = () => {
  return (
    <>
      {mapFilters((filter, index) => (
        <FilterImage key={index} filter={filter} options={{ number: 16 }} />
      ))}
      {mapFilters((filter, index) => (
        <FilterImage
          key={index}
          filter={filter}
          options={{ number: 16 }}
          lerp
        />
      ))}
    </>
  )
}

function App() {
  const [mode, setMode] = useState<Mode>("sandbox")

  const onChange = useCallback((mode: Mode) => {
    setMode(mode)
  }, [])

  return (
    <div className="App">
      <ModeGroup mode={mode} onChangeMode={onChange} />
      {mode === "gallery" && <Gallery />}
      {mode === "sandbox" && <SandboxFilters />}
    </div>
  )
}

export default App
