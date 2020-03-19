export interface IChart {
  id: string
  config: any
  data: null | any
}

export interface IDataSummary {
  [key: string]: {
    mean: number
    median: number
    maximum: number
    minimum: number
  }
}