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

export const coupleArray = ({  arrayA, arrayB, arrayC, labelA, labelB, labelC }) => {
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
  }
  
  return result
}

const LESS_THAN_1_DECIMAL_MAX_DIGITS = 4

export const nFormatter = (num, digits) => {

  if (num === Infinity) {
    return Number(num).toLocaleString('en-us')
  }

  if (num === NaN || !num) {
    return 0
  }

  const lookup = [
    // { value: 1, symbol: "" },
    // { value: 1e3, symbol: "k" },
    { value: 1e6, symbol: "M" },
    { value: 1e9, symbol: "G" },
    { value: 1e12, symbol: "T" },
    { value: 1e15, symbol: "P" },
    { value: 1e18, symbol: "E" }
  ]
  const rx = /\.0+$|(\.[0-9]*[1-9])0+$/
  var item = lookup.slice().reverse().find(function (item) {
    return num >= item.value
  })

  return item 
    ? (num / item.value).toFixed(digits).replace(rx, "$1") + item.symbol 
    : Number(num) < 1
      ? Number(num).toLocaleString('en-us', { maximumFrationDigits: LESS_THAN_1_DECIMAL_MAX_DIGITS })
      : Number(num).toLocaleString('en-us', { maximumFrationDigits: digits })

  // return Number(num).toLocaleString('en-us', { maximumFractionDigits: digits })
}

window.nFormatter = nFormatter