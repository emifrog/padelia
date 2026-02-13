export const HAND_OPTIONS = [
  { value: 'right', label: 'Droitier' },
  { value: 'left', label: 'Gaucher' },
]

export const SIDE_OPTIONS = [
  { value: 'right', label: 'Droite' },
  { value: 'left', label: 'Gauche' },
  { value: 'both', label: 'Les deux' },
]

export const STYLE_OPTIONS = [
  { value: 'offensive', label: 'Offensif' },
  { value: 'defensive', label: 'Défensif' },
  { value: 'mixed', label: 'Mixte' },
]

export const GOAL_OPTIONS = [
  { value: 'casual', label: 'Loisir' },
  { value: 'improvement', label: 'Progression' },
  { value: 'competition', label: 'Compétition' },
]

export const LEVEL_OPTIONS = Array.from({ length: 19 }, (_, i) => {
  const val = (i + 2) / 2
  return { value: String(val), label: `${val}` }
})

export const SIDE_LABELS: Record<string, string> = {
  left: 'Gauche',
  right: 'Droite',
  both: 'Les deux',
}
