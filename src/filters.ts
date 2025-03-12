export const WIDTH = 350
export const HEIGHT = 350

const DIAGONAL = Math.sqrt(2 * (WIDTH * WIDTH + HEIGHT * HEIGHT))

export class RGBColor {
  r: number
  g: number
  b: number

  static black = new RGBColor(0, 0, 0)

  constructor(r: number, g: number, b: number) {
    this.r = r
    this.g = g
    this.b = b
  }

  toString() {
    const rString = this.r.toString(16).padStart(2, "0")
    const gString = this.g.toString(16).padStart(2, "0")
    const bString = this.b.toString(16).padStart(2, "0")
    return `#${rString}${gString}${bString}`
  }

  static fromHex(str: string) {
    const rString = str.substr(1, 2)
    const gString = str.substr(3, 2)
    const bString = str.substr(5, 2)
    return new RGBColor(
      parseInt(rString, 16),
      parseInt(gString, 16),
      parseInt(bString, 16),
    )
  }

  static random() {
    return new RGBColor(
      Math.round(Math.random() * 255),
      Math.round(Math.random() * 255),
      Math.round(Math.random() * 255),
    )
  }

  static add(a: RGBColor, b: RGBColor) {
    return new RGBColor(a.r + b.r, a.g + b.g, a.b + b.b)
  }

  static sub(a: RGBColor, b: RGBColor) {
    return new RGBColor(a.r - b.r, a.g - b.g, a.b - b.b)
  }

  static mult(a: RGBColor, r: number) {
    return new RGBColor(a.r * r, a.g * r, a.b * r)
  }
}

export interface FilterOptions {
  origin?: {
    x: number
    y: number
  }
  number?: number
  frequency?: number
  amplitude?: number
  phase?: number
}

export type Filter<T extends FilterOptions = FilterOptions> = (
  x: number,
  y: number,
  option: T,
) => number

export const getColor = (
  index: number,
  colors: RGBColor[],
): [RGBColor, RGBColor[]] => {
  const localColors = colors.concat()
  index = Math.floor(index)
  if (colors[index]) {
    return [colors[index], localColors]
  } else {
    const newColor = new RGBColor(
      Math.round(Math.random() * 255),
      Math.round(Math.random() * 255),
      Math.round(Math.random() * 255),
    )
    localColors[index] = newColor
    return [newColor, localColors]
  }
}

export const lerpFilter = (
  x: number,
  y: number,
  options: FilterOptions,
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

export const getLerpColor = (index: number, colors: RGBColor[]): RGBColor => {
  const index1 = Math.ceil(index)
  const index2 = Math.floor(index)
  const t = index % 1
  const [color1] = getColor(index1, colors)
  const [color2] = getColor(index2, colors)
  return {
    r: color1.r + t * (color2.r - color1.r),
    g: color1.g + t * (color2.g - color1.g),
    b: color1.b + t * (color2.b - color1.b),
  }
}

export const randomFilter = (x: number, y: number): number => {
  const options = {
    number: 15,
  }
  const keys = Object.keys(Filters)
  const index = Math.floor(Math.random() * keys.length)
  const key = keys[index] as keyof typeof Filters
  const fn = Filters[key]
  return fn(x, y, options)
}

const wavyCircles: Filter = (x, y, options) => {
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

const wavyBeams: Filter = (x, y, options) => {
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

const wave = (val: number, ref: number, amp = 1, freq = 1, phase = 0) => {
  const wave = (Math.sin(freq * ref + phase) + 1) * amp
  return val + wave
}

const wavyDiagonalsBT: Filter = (x, y, options) => {
  const { number = 16, frequency = 1, amplitude = 3 } = options
  return wave(x + y, x - y, amplitude, frequency / 10) / (DIAGONAL / number)
}

const wavyDiagonalsTB: Filter = (x, y, options) => {
  const { number = 16, frequency = 1, amplitude = 3 } = options
  return (
    wave(x - y, x + y, amplitude, frequency / 10) / (DIAGONAL / number) + number
  )
}

const wavyHorizontals: Filter = (x, y, options) => {
  const { number = 16, frequency = 0.2, amplitude = 5 } = options
  return wave(y, x, amplitude, frequency) / (HEIGHT / number)
}

const wavyVerticals: Filter = (x, y, options) => {
  const { number = 16, frequency = 0.2, amplitude = 5 } = options
  return wave(x, y, amplitude, frequency) / (WIDTH / number)
}

const spiral: Filter = (x, y, options) => {
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

const circlyBeams: Filter = (x, y, options) => {
  const { number = 16 } = options
  const dx = x - WIDTH / 2
  const dy = y - HEIGHT / 2
  const dist = Math.sqrt(dx * dx + dy * dy)
  const phi = Math.atan2(x - WIDTH / 2, y - HEIGHT / 2) + Math.PI
  const deg = (phi / (Math.PI * 2)) * 360
  const wavy = wave(deg + number, dist * dist, 10, 0.2) / (360 / number)
  return wavy % number
}

export const mapFilters = (fn: (filter: Filter, index?: number) => unknown) => {
  const keys = Object.keys(Filters) as (keyof typeof Filters)[]
  return keys.map((key, index) => {
    const filter = Filters[key]
    return fn(filter, index)
  })
}

const Filters = {
  wavyCircles,
  wavyBeams,
  wavyDiagonalsBT,
  wavyDiagonalsTB,
  wavyHorizontals,
  wavyVerticals,
  spiral,
  circlyBeams,
}

export default Filters
