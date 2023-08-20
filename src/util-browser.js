exports.deprecate = (fn, msg) => {
  let once = true
  return function (...args) {
    if (once) {
      console.warn(`DeprecationWarning: ${msg}`)
      once = false
    }
    return fn.apply(this, args)
  }
}
