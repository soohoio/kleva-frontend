import PriorityQueue from 'javascript-priority-queue'

export const toAPY = (apr) => {
  return ((1 + (apr / 365 / 100)) ** 365 - 1) * 100
}

export const toFixed = (num, fixed) => {
  var re = new RegExp('^-?\\d+(?:\.\\d{0,' + (fixed || -1) + '})?');
  return num.toString().match(re)[0];
}

export const isValidDecimal = (num, decimalLimit) => {
  const splitted = String(num).split('.')

  const decimalPoints = splitted[1]
  if (!decimalPoints) return num

  return decimalPoints.length <= decimalLimit
}

window.isValidDecimal = isValidDecimal