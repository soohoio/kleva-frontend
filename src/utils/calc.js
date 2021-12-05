export const toAPY = (apr) => {
  return ((1 + (apr / 365 / 100)) ** 365 - 1) * 100
}