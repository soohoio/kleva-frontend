export const addressKeyFind = (item, address) => {
  return item?.[address] || item?.[address.toLowerCase()]
}

export const isSameAddress = (address1, address2) => {
  return address1.toLowerCase() === address2.toLowerCase()
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

const LESS_THAN_1_DECIMAL_MAX_DIGITS = 2

export const nFormatter = (num, digits, locale) => {

  if (num == '-') {
    return '-'
  }

  if (num === Infinity) {
    return Number(num).toLocaleString('en-us')
  }

  if (num === NaN || !num) {
    return 0
  }

  const lookup = locale == 'ko'
    ? [
        { value: 1e4, symbol: "만" },
        { value: 1e8, symbol: "억" },
    ] 
    : [
        { value: 1e6, symbol: "M" },
        { value: 1e9, symbol: "B" },
        { value: 1e12, symbol: "T" },
        { value: 1e15, symbol: "P" },
        { value: 1e18, symbol: "E" },
        { value: 1e21, symbol: "Z" },
        { value: 1e24, symbol: "Y" },
        { value: 1e27, symbol: "b" },
        { value: 1e30, symbol: "ge" },
        { value: 1e33, symbol: "sa" },
        { value: 1e36, symbol: "pi" },
        { value: 1e39, symbol: "al" },
        { value: 1e42, symbol: "kr" },
        { value: 1e45, symbol: "am" },
        { value: 1e48, symbol: "pe" },
    ]
  const rx = /\.0+$|(\.[0-9]*[1-9])0+$/
  var item = lookup.slice().reverse().find(function (item) {
    return num >= item.value
  })

  return item 
    ? (num / item.value).toFixed(digits).replace(rx, "$1") + item.symbol 
    : Number(num) < 1
      ? Number(num).toLocaleString('en-us', { maximumFractionDigits: LESS_THAN_1_DECIMAL_MAX_DIGITS })
      : Number(num).toLocaleString('en-us', { maximumFractionDigits: digits })
}

window.nFormatter = nFormatter

function numberWithCommas(x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
}

export const noRounding = (num, digits) => {
  if (String(num).indexOf('e-') !== -1) {
    return num
  }

  const splitted = String(num).split('.')

  const integerPoints = splitted[0]
  const decimalPoints = splitted[1]

  if (!decimalPoints) return num

  const integerWithCommas = numberWithCommas(integerPoints)

  if (digits == 0) {
    return integerWithCommas
  }

  return integerWithCommas + "." + String(decimalPoints.slice(0, digits))
}

export const coverSmallNumber = (val, decimals) => {
  if (val < new BigNumber(1).div(10 ** decimals).toNumber()) {
    return val
  }

  return Number(val).toLocaleString('en-us', { maximumFractionDigits: decimals })
}