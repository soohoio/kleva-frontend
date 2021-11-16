import TWEEN from '@tweenjs/tween.js'

export const Tween = TWEEN.Tween

export const animate = () => {
  requestAnimationFrame(animate)
  TWEEN.update()
}

animate()

export default TWEEN