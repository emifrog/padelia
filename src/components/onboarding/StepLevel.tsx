import { Select } from '@/components/ui'
import { HAND_OPTIONS, LEVEL_OPTIONS } from '@/lib/constants/profile'

interface StepLevelProps {
  level: string
  dominantHand: string
  onLevelChange: (value: string) => void
  onDominantHandChange: (value: string) => void
}

export function StepLevel({
  level,
  dominantHand,
  onLevelChange,
  onDominantHandChange,
}: StepLevelProps) {
  return (
    <>
      <Select
        id="level"
        label="Ton niveau (1 à 10)"
        options={LEVEL_OPTIONS}
        value={level}
        onChange={(e) => onLevelChange(e.target.value)}
      />
      <div className="rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground space-y-1">
        <p><strong className="text-foreground">1-3 :</strong> Débutant — Tu découvres le padel</p>
        <p><strong className="text-foreground">3-5 :</strong> Intermédiaire — Tu maîtrises les bases</p>
        <p><strong className="text-foreground">5-7 :</strong> Avancé — Bon niveau technique</p>
        <p><strong className="text-foreground">7-10 :</strong> Expert — Joueur compétitif</p>
      </div>
      <Select
        id="dominant_hand"
        label="Main dominante"
        options={HAND_OPTIONS}
        value={dominantHand}
        onChange={(e) => onDominantHandChange(e.target.value)}
      />
    </>
  )
}
