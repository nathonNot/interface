import { UAParser } from 'ua-parser-js'

const parser = new UAParser(window.navigator.userAgent)
const { type } = parser.getDevice()

export const isMobile = type === 'mobile' || type === 'tablet'
const platform = parser.getOS().name
export const isIOS = platform === 'iOS'
export const isNonIOSPhone = !isIOS && type === 'mobile'

export const fontSize = isMobile ? 14 : 16;
export const navHeight = isMobile ? 60 : 96;
export const bottomHeight = isMobile ? 60 : 0;
