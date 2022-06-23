if (process.env.NODE_ENV === 'test') {
  require(`./frontserver.real.js`)
  return
}

require(`./frontserver.${process.env.NODE_ENV}.js`)
