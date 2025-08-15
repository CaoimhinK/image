import { getColor, RGBColor } from "./utils"

export const WIDTH = 350
export const HEIGHT = 350

const DIAGONAL = Math.sqrt(2 * (WIDTH * WIDTH + HEIGHT * HEIGHT))

export type Filter<O extends object = object> = (
  x: number,
  y: number,
  options: O,
) => number

export const lerpFilter = <O extends { number?: number }>(
  x: number,
  y: number,
  options: O,
  filter: Filter,
  colors: RGBColor[],
): [RGBColor, RGBColor[]] => {
  const colorIndex = filter(x, y, options)
  const index1 =
    Math.floor(colorIndex) % (options.number || Number.POSITIVE_INFINITY)
  const index2 =
    Math.ceil(colorIndex) % (options.number || Number.POSITIVE_INFINITY)
  const t = colorIndex % 1
  const localColors = colors.concat()
  const [c0, newColors0] = getColor(index1, localColors)
  const [c1, newColors1] = getColor(index2, newColors0)
  return [RGBColor.add(c0, RGBColor.mult(RGBColor.sub(c1, c0), t)), newColors1]
}

export const randomFilter = (x: number, y: number): number => {
  const options = {
    number: 15,
  }
  const keys = Object.keys(FILTERS)
  const index = Math.floor(Math.random() * keys.length)
  const key = keys[index] as keyof typeof FILTERS
  const fn = FILTERS[key]
  return fn(x, y, options)
}

const wave = (val: number, ref: number, amp = 1, freq = 1, phase = 0) => {
  const wave = (Math.sin(freq * ref + phase) + 1) * amp
  return val + wave
}

type WavyCirclesOptions = {
  origin?: { x: number; y: number }
  number?: number
  frequency?: number
  phase?: number
  amplitude?: number
}

const wavyCircles: Filter<WavyCirclesOptions> = (x, y, options) => {
  const {
    origin = { x: WIDTH / 2, y: HEIGHT / 2 },
    number = 8,
    frequency = 10,
    phase = 0,
    amplitude = 1,
  } = options
  const dx = x - origin.x
  const dy = y - origin.y
  const phi =
    Math.atan2(x - origin.x, y - origin.y) + (phase / 360) * Math.PI * 2
  const dist = Math.sqrt(dx * dx + dy * dy) / (WIDTH / number / 2)
  const circ =
    dist + (((Math.cos(phi * frequency) + 1) * dist) / 10) * amplitude
  return circ
}

type WavyBeamsOptions = {
  origin?: { x: number; y: number }
  number?: number
  frequency?: number
  amplitude?: number
  phase?: number
}

const wavyBeams: Filter<WavyBeamsOptions> = (x, y, options) => {
  const {
    origin = { x: WIDTH / 2, y: HEIGHT / 2 },
    number = 16,
    frequency = 1,
    amplitude = 3,
    phase = 0,
  } = options
  const dx = x - origin.x
  const dy = y - origin.y
  const dist = Math.sqrt(dx * dx + dy * dy)
  const phi = Math.atan2(x - origin.x, y - origin.y) + Math.PI
  const deg = (phi / (Math.PI * 2)) * 360 + phase
  const wavy = wave(deg, dist, amplitude, frequency / 10) / (360 / number)
  return wavy % number
}

type WavyOptions = {
  number?: number
  frequency?: number
  amplitude?: number
}

const wavyDiagonalsBT: Filter<WavyOptions> = (x, y, options) => {
  const { number = 16, frequency = 1, amplitude = 3 } = options
  return wave(x + y, x - y, amplitude, frequency / 10) / (DIAGONAL / number)
}

const wavyDiagonalsTB: Filter<WavyOptions> = (x, y, options) => {
  const { number = 16, frequency = 1, amplitude = 3 } = options
  return (
    wave(x - y, x + y, amplitude, frequency / 10) / (DIAGONAL / number) + number
  )
}

const wavyHorizontals: Filter<WavyOptions> = (x, y, options) => {
  const { number = 16, frequency = 0.2, amplitude = 5 } = options
  return wave(y, x, amplitude, frequency) / (HEIGHT / number)
}

const wavyVerticals: Filter<WavyOptions> = (x, y, options) => {
  const { number = 16, frequency = 0.2, amplitude = 5 } = options
  return wave(x, y, amplitude, frequency) / (WIDTH / number)
}

type SpiralOptions = {
  number?: number
  frequency?: number
  phase?: number
}

const spiral: Filter<SpiralOptions> = (x, y, options) => {
  const { number = 16, frequency = 1, phase = 0 } = options
  const dx = x - WIDTH / 2
  const dy = y - HEIGHT / 2
  const dist = Math.sqrt(dx * dx + dy * dy)
  const phi =
    Math.atan2(x - WIDTH / 2, y - HEIGHT / 2) +
    Math.PI +
    (phase / 360) * Math.PI * 2
  const deg = (phi / (Math.PI * 2)) * 360
  return (((deg + dist * frequency) * number) / 360) % number
}

type CirclyBeamsOptions = { number?: number }

const circlyBeams: Filter<CirclyBeamsOptions> = (x, y, options) => {
  const { number = 16 } = options
  const dx = x - WIDTH / 2
  const dy = y - HEIGHT / 2
  const dist = Math.sqrt(dx * dx + dy * dy)
  const phi = Math.atan2(x - WIDTH / 2, y - HEIGHT / 2) + Math.PI
  const deg = (phi / (Math.PI * 2)) * 360
  const wavy = wave(deg + number, dist * dist, 10, 0.2) / (360 / number)
  return wavy % number
}

export const FILTERS = {
  wavyCircles,
  wavyBeams,
  wavyDiagonalsBT,
  wavyDiagonalsTB,
  wavyHorizontals,
  wavyVerticals,
  spiral,
  circlyBeams,
} as const

export type FilterType = keyof typeof FILTERS

export const FILTER_KEYS = Object.keys(FILTERS) as FilterType[]

export const mapFilters = (fn: (filter: Filter, index?: number) => unknown) => {
  return FILTER_KEYS.map((key, index) => {
    const filter = FILTERS[key]
    return fn(filter, index)
  })
}
