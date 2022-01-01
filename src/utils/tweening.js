import TWEEN from '@tweenjs/tween.js'
export const Tween = TWEEN.Tween
export const _animate = () => {
  requestAnimationFrame(_animate)
  TWEEN.update()
}

_animate()

export default TWEEN