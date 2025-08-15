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
