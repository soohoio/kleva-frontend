import { currentLocale$ } from 'streams/i18n'
import { browserHistory$ } from '../streams/location'
import { prevLocation$ } from '../streams/location'

import extractJSON from '../utils/script'

export const addressKeyFind = (item, address = "") => {
  return item?.[address] || item?.[address.toLowerCase()]
}

export const isSameAddress = (address1, address2) => {
  return String(address1).toLowerCase() === String(address2).toLowerCase()
}

export const getFirstBrowserLanguage = function () {
  var nav = window.navigator,
    browserLanguagePropertyKeys = ['language', 'browserLanguage', 'systemLanguage', 'userLanguage'],
    i,
    language;

  // support for HTML 5.1 "navigator.languages"
  if (Array.isArray(nav.languages)) {
    for (i = 0; i < nav.languages.length; i++) {
      language = nav.languages[i]
      if (language && language.length) {
        return language
      }
    }
  }

  // support for other well known properties in browsers
  for (i = 0; i < browserLanguagePropertyKeys.length; i++) {
    language = nav[browserLanguagePropertyKeys[i]]
    if (language && language.length) {
      return language
    }
  }

  return null
}

export const coupleArray = ({  
  arrayA, 
  arrayB, 
  arrayC,
  arrayD,
  arrayE,
  arrayF,
   
  labelA, 
  labelB, 
  labelC,
  labelD,
  labelE,
  labelF,
}) => {
  let result = []
  for (let i = 0; i < arrayA.length; i++) {
    if (labelA) {
      result[i] = {
        [labelA]: arrayA[i],
      }
    }

    if (labelB) {
      result[i] = {
        ...result[i],
        [labelB]: arrayB[i],
      }
    }

    if (labelC) {
      result[i] = {
        ...result[i],
        [labelC]: arrayC[i],
      }
    }
    
    if (labelD) {
      result[i] = {
        ...result[i],
        [labelD]: arrayD[i],
      }
    }
    
    if (labelE) {
      result[i] = {
        ...result[i],
        [labelE]: arrayE[i],
      }
    }
    
    if (labelF) {
      result[i] = {
        ...result[i],
        [labelF]: arrayF[i],
      }
    }
  }
  
  return result
}

export const nFormatter = (num, forceDigits, forceLocale, lastOnly) => {

  const locale = forceLocale || currentLocale$.value

  if (num == '-') {
    return '-'
  }

  if (num === Infinity) {
    return Number(num).toLocaleString('en-us')
  }

  if (num === NaN || !num) {
    return 0
  }

  // rule 10 (ko-only 해)
  if (num >= 100_000_000_000_000_000_000) {

    if (locale === 'ko') {
      const splitted = String(num / 10_000_000_000_000_000).split('.')
      const integerPart = splitted[0]
      const decimalPart = splitted[1] ? "." + Number(`0.${splitted[1]}`).toFixed(2).slice(2) : ''

      return integerPart + decimalPart + '해'
    }
  }

  // rule 09 (ko-only 경)
  if (num >= 10_000_000_000_000_000) {

    if (locale === 'ko') {
      const splitted = String(num / 10_000_000_000_000_000).split('.')
      const integerPart = splitted[0]
      const decimalPart = splitted[1] ? "." + Number(`0.${splitted[1]}`).toFixed(2).slice(2) : ''

      return integerPart + decimalPart + '경'
    }
  }

  // rule 08 (ko: 조, en: Trillion)
  if (num >= 1_000_000_000_000) {

    if (locale === 'ko') {
      const splitted = String(num / 1_000_000_000_000).split('.')
      const integerPart = splitted[0]
      const decimalPart = splitted[1] ? "." + Number(`0.${splitted[1]}`).toFixed(2).slice(2) : ''

      return integerPart + decimalPart + '조'
    } else {
      const splitted = String(num / 1_000_000_000_000).split('.')
      const integerPart = splitted[0]
      const decimalPart = splitted[1] ? "." + Number(`0.${splitted[1]}`).toFixed(2).slice(2) : ''

      return integerPart + decimalPart + 'T'
    }
  }
  
  // rule 07 (en-only: B)
  if (num >= 1_000_000_000) {

    if (locale === 'en') {
      const splitted = String(num / 1_000_000_000).split('.')
      const integerPart = splitted[0]
      const decimalPart = splitted[1] ? "." + Number(`0.${splitted[1]}`).toFixed(2).slice(2) : ''

      return integerPart + decimalPart + 'B'
    }
  }

  // rule 06 (ko-only)
  if (num >= 100_000_000) {
    if (locale === 'ko') {
      const splitted = String(num / 100_000_000).split('.')
      const integerPart = splitted[0]
      const decimalPart = splitted[1] ? "." + Number(`0.${splitted[1]}`).toFixed(2).slice(2) : ''

      return integerPart + decimalPart + '억'
    }
  }

  // rule 05
  if (num >= 1_000_000) {

    if (locale === 'ko') {
      const splitted = String(num / 10_000).split('.')
      const integerPart = splitted[0]
      const decimalPart = splitted[1] ? "." + Number(`0.${splitted[1]}`).toFixed(2).slice(2) : ''

      if (forceDigits !== undefined) {
        return integerPart + '만'
      }

      return integerPart + decimalPart + '만'
    } else {
      const splitted = String(num / 1_000_000).split('.')
      const integerPart = splitted[0]
      const decimalPart = splitted[1] ? "." + Number(`0.${splitted[1]}`).toFixed(2).slice(2) : ''

      return integerPart + decimalPart + "M"
    }
  }

  // rule 04
  if (num >= 1_000) {
    return Number(num).toLocaleString('en-us', { maximumFractionDigits: 0 })
  }

  // rule 03
  if (num >= 1) {
    if (forceDigits !== undefined) {
      return Number(num).toLocaleString('en-us', { maximumFractionDigits: forceDigits })
    }
    return Number(num).toLocaleString('en-us', { maximumFractionDigits: 4 })
  }

  // rule 02
  if (num >= 1e-6) {
    if (forceDigits !== undefined) {
      return Number(num).toLocaleString('en-us', { maximumFractionDigits: forceDigits })
    }
    return noRounding(num, 6)
  }

  // rule 01
  if (num > 0 && num < 1e-6) {
    return 0
  }

  // negative value
  if (num < 0) {
    return `-${nFormatter(num * -1)}`
  }
}

window.nFormatter = nFormatter

function numberWithCommas(x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
}

export const noRounding = (num, digits, noTrailingZero) => {
  if (String(num).indexOf('e-') !== -1) {

    if (num >= 1e-6) {
      return num
    }

    return 0
  }

  const splitted = String(num).split('.')

  const integerPoints = splitted[0]
  const decimalPoints = splitted[1]

  const integerWithCommas = numberWithCommas(integerPoints)
  
  if (!decimalPoints) {
    if (splitted.length == 2) {
      return integerWithCommas + "."
    }
    return integerWithCommas
  }

  if (digits == 0) {
    return integerWithCommas
  }

  if (noTrailingZero) {
    return Number(integerWithCommas + "." + String(decimalPoints.slice(0, digits))).toString()
  }

  return integerWithCommas + "." + String(decimalPoints.slice(0, digits))
}

export const coverSmallNumber = (val, decimals) => {
  if (val < new BigNumber(1).div(10 ** decimals).toNumber()) {
    return val
  }

  return Number(val).toLocaleString('en-us', { maximumFractionDigits: decimals })
}

export const padAddress = (address) => {
  return "0x" + address.slice(2).padStart(64, "0")
}

window.nFormatter = nFormatter
window.noRounding = noRounding

export const replaceall = function (replaceThis, withThis, inThis) {
  withThis = withThis.replace(/\$/g, "$$$$");
  return inThis.replace(new RegExp(replaceThis.replace(/([\/\,\!\\\^\$\{\}\[\]\(\)\.\*\+\?\|<>\-\&])/g, "\\$&"), "g"), withThis);
}

window.replaceall = replaceall

export const getQS = (location) => {
  var a = location
    ? location.search.substr(1).split('&')
    : window.location.search.substr(1).split('&');

  if (a == "") return {};
  var b = {};
  for (var i = 0; i < a.length; ++i) {
    var p = a[i].split('=', 2);
    if (p.length == 1)
      b[p[0]] = "";
    else
      b[p[0]] = decodeURIComponent(p[1].replace(/\+/g, " "));
  }
  return b;
}

export const backPage = () => {
  const prevQs = getQS(prevLocation$.value)

  if (prevLocation$.value && prevQs?.t) {
    currentTab$.next(prevQs?.t)
    return
  }

  if (prevLocation$.value?.pathname === "/") {
    browserHistory$.next('/')
    return
  }
  currentTab$.next('myasset')
}

export const compactKnsDomain = (domain, sliceUntil) => {
  const [name, klaySuffix] = domain.split('.')

  if (sliceUntil !== undefined && (name.length > sliceUntil)) {
    return name.slice(0, sliceUntil) + "...." + klaySuffix
  }

  return domain
}

window.compactKnsDomain = compactKnsDomain