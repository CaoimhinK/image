export const WIDTH = 350
export const HEIGHT = 350

const DIAGONAL = Math.sqrt(2 * (WIDTH * WIDTH + HEIGHT * HEIGHT))

export interface RGBColor {
  r: number
  g: number
  b: number
}

export interface FilterOptions {
  thickness?: number
  number?: number
  frequency?: number
  amplitude?: number
  phase?: number
}

export type Filter = (x: number, y: number, option: FilterOptions) => number

export const getColor = (index: number, colors: RGBColor[]): RGBColor => {
  index = Math.floor(index)
  if (colors[index]) {
    return colors[index]
  } else {
    const newColor = {
      r: Math.round(Math.random() * 255),
      g: Math.round(Math.random() * 255),
      b: Math.round(Math.random() * 255),
    }
    colors[index] = newColor
    return newColor
  }
}

export const getLerpColor = (index: number, colors: RGBColor[]): RGBColor => {
  const index1 = Math.ceil(index)
  const index2 = Math.floor(index)
  const t = index % 1
  let color1 = getColor(index1, colors)
  let color2 = getColor(index2, colors)
  return {
    r: color1.r + t * (color2.r - color1.r),
    g: color1.g + t * (color2.g - color1.g),
    b: color1.b + t * (color2.b - color1.b),
  }
}

export const randomFilter = (x: number, y: number): number => {
  const options = {
    thickness: 15,
  }
  const keys = Object.keys(Filters)
  const index = Math.floor(Math.random() * keys.length)
  const key = keys[index] as keyof typeof Filters
  const fn = Filters[key]
  return fn(x, y, options)
}

const circles: Filter = (x, y, options) => {
  const {thickness, number = 8} = options
  const dx = x - WIDTH / 2
  const dy = y - HEIGHT / 2
  const dist = Math.sqrt(dx * dx + dy * dy) /
    ((thickness) ? thickness / 2 : WIDTH / number / 2)
  return dist
}

const wavyCircles: Filter = (x, y, options) => {
  const {
    thickness,
    number = 8,
    frequency = 10,
    phase = 3,
    amplitude = 1,
  } = options
  const dx = x - WIDTH / 2
  const dy = y - HEIGHT / 2
  const phi = Math.atan2(x - WIDTH / 2, y - HEIGHT / 2)
  const dist = (thickness)
    ? Math.sqrt(dx * dx + dy * dy) / (thickness / 2)
    : Math.sqrt(dx * dx + dy * dy) / (WIDTH / number / 2)
  const circ = dist + Math.sin(phi * frequency + (phase/360*Math.PI*2)) * dist/10 * amplitude
  return circ
}

const beams: Filter = (x, y, options) => {
  const {thickness, number = 16} = options
  const phi = Math.atan2(x - WIDTH / 2, y - HEIGHT / 2) + Math.PI
  const deg = phi / (Math.PI * 2) * 360
  if (thickness) {
    const num = 360 / (thickness || 16)
    const beam = num * (deg + (360 / num / 2)) / 360
    return beam % num
  } else {
    const beam = number * (deg + (360 / number / 2)) / 360
    return beam % number
  }
}

const wavyBeams: Filter = (x, y, options) => {
  const {thickness, number = 16} = options
  const dx = x - WIDTH / 2
  const dy = y - HEIGHT / 2
  const dist = Math.sqrt(dx * dx + dy * dy)
  const phi = Math.atan2(x - WIDTH / 2, y - HEIGHT / 2) + Math.PI
  const deg = (phi / (Math.PI * 2) * 360)
  if (thickness) {
    const wavy = wave(deg + (360 / thickness), dist, 3, 0.2) / thickness
    return wavy % (360 / thickness)
  } else {
    const wavy = wave(deg + number, dist, 3, 0.2) / (360 / number)
    return wavy % number
  }
}

const wave = (val: number, ref: number, amp = 1, freq = 1, phase = 0) => {
  const wave = Math.sin(freq * ref + phase) * amp
  return val + wave
}

const diagonalsBT: Filter = (x, y, options) => {
  const {thickness, number = 16} = options
  if (thickness) {
    return (x + y) / thickness
  } else {
    return (x + y) / (DIAGONAL / number)
  }
}

const wavyDiagonalsBT: Filter = (x, y, options) => {
  const {thickness, number = 16} = options
  if (thickness) {
    return wave((x + y), (x - y), 5, 0.2) / thickness
  } else {
    return wave((x + y), (x - y), 5, 0.2) / (DIAGONAL / number)
  }
}

const diagonalsTB: Filter = (x, y, options) => {
  const {thickness, number = 16} = options
  if (thickness) {
    return (x - y) / thickness
  } else {
    return (x - y) / (DIAGONAL / number)
  }
}

const wavyDiagonalsTB: Filter = (x, y, options) => {
  const {thickness, number = 16} = options
  if (thickness) {
    return wave((x - y), (x + y), 5, 0.2) / thickness
  } else {
    return wave((x - y), (x + y), 5, 0.2) / (DIAGONAL / number)
  }
}

const horizontals: Filter = (_x, y, options) => {
  const {thickness, number = 16} = options
  if (thickness) {
    return y / thickness
  } else {
    return y / (HEIGHT / number)
  }
}

const wavyHorizontals: Filter = (x, y, options) => {
  const {thickness, number = 16} = options
  if (thickness) {
    return wave(y, x, 5, 0.2) / thickness
  } else {
    return wave(y, x, 5, 0.2) / (HEIGHT / number)
  }
}

const verticals: Filter = (x, _y, options) => {
  const {thickness, number = 16} = options
  if (thickness) {
    return x / thickness
  } else {
    return x / (WIDTH / number)
  }
}

const wavyVerticals: Filter = (x, y, options) => {
  const {thickness, number = 16} = options
  if (thickness) {
    return wave(x, y, 5, 0.2) / thickness
  } else {
    return wave(x, y, 5, 0.2) / (WIDTH / number)
  }
}

const spiral: Filter = (x, y, options) => {
  const {thickness, number = 16} = options
  const dx = x - WIDTH / 2
  const dy = y - HEIGHT / 2
  const dist = Math.sqrt(dx * dx + dy * dy)
  const phi = Math.atan2(x - WIDTH / 2, y - HEIGHT / 2) + Math.PI
  const beam = (phi / (Math.PI * 2) * 360)
  if (thickness) {
    const num = 360 / thickness
    return (num * (beam + dist) / 360) % num
  } else {
    return (number * (beam + dist) / 360) % number
  }
}

const circlyBeams: Filter = (x, y, options) => {
  const {thickness, number = 16} = options
  const dx = x - WIDTH / 2
  const dy = y - HEIGHT / 2
  const dist = Math.sqrt(dx * dx + dy * dy)
  const phi = Math.atan2(x - WIDTH / 2, y - HEIGHT / 2) + Math.PI
  const deg = (phi / (Math.PI * 2) * 360)
  if (thickness) {
    const wavy = wave(deg + (360 / thickness), dist * dist, 3, 0.2) / thickness
    return wavy % (360 / thickness)
  } else {
    const wavy = wave(deg + number, dist * dist, 10, 0.2) / (360 / number)
    return wavy % number
  }
}

export const mapFilters = (fn: (filter: Filter, index?: number) => any) => {
  const keys = Object.keys(Filters) as (keyof typeof Filters)[]
  return keys.map((key, index) => {
    const filter = Filters[key]
    return fn(filter, index)
  })
}

const Filters = {
  circles,
  wavyCircles,
  beams,
  wavyBeams,
  diagonalsBT,
  wavyDiagonalsBT,
  diagonalsTB,
  wavyDiagonalsTB,
  horizontals,
  wavyHorizontals,
  verticals,
  wavyVerticals,
  spiral,
  circlyBeams,
}

export default Filters
