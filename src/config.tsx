export interface IAppConfig {
  REACT_APP_BIS_API: string,
  REACT_APP_PUBLIC_TOKEN: string,
  REACT_APP_SUPPORT_EMAIL: string,
  REACT_APP_ENV: string,
  REACT_APP_DEV: boolean,
}

// @ts-ignore
const AppConfig: IAppConfig = window.config
export default AppConfig
