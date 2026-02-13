import { Select, Textarea } from '@/components/ui'
import { SIDE_OPTIONS, STYLE_OPTIONS, GOAL_OPTIONS } from '@/lib/constants/profile'

interface StepStyleProps {
  preferredSide: string
  playStyle: string
  goal: string
  bio: string
  onPreferredSideChange: (value: string) => void
  onPlayStyleChange: (value: string) => void
  onGoalChange: (value: string) => void
  onBioChange: (value: string) => void
}

export function StepStyle({
  preferredSide,
  playStyle,
  goal,
  bio,
  onPreferredSideChange,
  onPlayStyleChange,
  onGoalChange,
  onBioChange,
}: StepStyleProps) {
  return (
    <>
      <Select
        id="preferred_side"
        label="Côté préféré"
        options={SIDE_OPTIONS}
        value={preferredSide}
        onChange={(e) => onPreferredSideChange(e.target.value)}
      />
      <div className="grid grid-cols-2 gap-4">
        <Select
          id="play_style"
          label="Style de jeu"
          options={STYLE_OPTIONS}
          value={playStyle}
          onChange={(e) => onPlayStyleChange(e.target.value)}
        />
        <Select
          id="goal"
          label="Objectif"
          options={GOAL_OPTIONS}
          value={goal}
          onChange={(e) => onGoalChange(e.target.value)}
        />
      </div>
      <Textarea
        id="bio"
        label="Bio (optionnel)"
        placeholder="Parle un peu de toi et de ton jeu..."
        rows={3}
        value={bio}
        onChange={(e) => onBioChange(e.target.value)}
      />
    </>
  )
}
