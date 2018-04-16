export interface Theme {
  accent?: string,
  primary?: string,
  bg?: string,
  dimens?: ThemesDimens
}

export interface ThemesDimens {
  lineWidth?: number,
  nodeRadius?: number,
  nodeCore?: number,
  nodeRing?: number
}

export interface CoordinatesXY {
  x: number,
  y: number
}

export interface PatternNode {
  row: number,
  col: number
}
