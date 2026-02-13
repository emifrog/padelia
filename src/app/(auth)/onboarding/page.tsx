'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button, Input, Select, Textarea } from '@/components/ui'
import { ArrowLeft, ArrowRight, User, Target, Gamepad2, Check } from 'lucide-react'
import { geocodeCity } from '@/lib/utils/geocode'

const HAND_OPTIONS = [
  { value: 'right', label: 'Droitier' },
  { value: 'left', label: 'Gaucher' },
]

const SIDE_OPTIONS = [
  { value: 'right', label: 'Droite' },
  { value: 'left', label: 'Gauche' },
  { value: 'both', label: 'Les deux' },
]

const STYLE_OPTIONS = [
  { value: 'offensive', label: 'Offensif' },
  { value: 'defensive', label: 'Défensif' },
  { value: 'mixed', label: 'Mixte' },
]

const GOAL_OPTIONS = [
  { value: 'casual', label: 'Loisir' },
  { value: 'improvement', label: 'Progression' },
  { value: 'competition', label: 'Compétition' },
]

const LEVEL_OPTIONS = Array.from({ length: 19 }, (_, i) => {
  const val = (i + 2) / 2
  return { value: String(val), label: `${val}` }
})

const STEPS = [
  { icon: User, title: 'Qui es-tu ?', subtitle: 'Ton identité de joueur' },
  { icon: Target, title: 'Ton niveau', subtitle: 'Pour trouver les bons partenaires' },
  { icon: Gamepad2, title: 'Ton style', subtitle: 'Position, jeu et objectif' },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Form state
  const [username, setUsername] = useState('')
  const [fullName, setFullName] = useState('')
  const [city, setCity] = useState('')
  const [level, setLevel] = useState('3')
  const [dominantHand, setDominantHand] = useState('right')
  const [preferredSide, setPreferredSide] = useState('right')
  const [playStyle, setPlayStyle] = useState('mixed')
  const [goal, setGoal] = useState('casual')
  const [bio, setBio] = useState('')

  function validateStep(): boolean {
    setError('')
    if (step === 0) {
      if (username.length < 3) { setError('Le pseudo doit faire au moins 3 caractères.'); return false }
      if (!/^[a-zA-Z0-9_]+$/.test(username)) { setError('Pseudo : lettres, chiffres et _ uniquement.'); return false }
      if (fullName.length < 2) { setError('Renseigne ton nom.'); return false }
      if (city.length < 2) { setError('Renseigne ta ville.'); return false }
    }
    return true
  }

  function handleNext() {
    if (!validateStep()) return
    if (step < STEPS.length - 1) setStep(step + 1)
  }

  function handleBack() {
    setError('')
    if (step > 0) setStep(step - 1)
  }

  async function handleSubmit() {
    if (!validateStep()) return
    setSaving(true)
    setError('')

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      // Geocode city to get coordinates
      const geo = await geocodeCity(city)

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          username,
          full_name: fullName,
          city,
          latitude: geo?.latitude ?? null,
          longitude: geo?.longitude ?? null,
          level: parseFloat(level),
          computed_level: parseFloat(level),
          dominant_hand: dominantHand,
          preferred_side: preferredSide,
          play_style: playStyle,
          goal,
          bio: bio || null,
        })
        .eq('id', user.id)

      if (updateError) {
        if (updateError.code === '23505') {
          setError('Ce pseudo est déjà pris.')
        } else {
          setError('Erreur lors de la sauvegarde.')
        }
        return
      }

      router.push('/feed')
      router.refresh()
    } catch {
      setError('Une erreur est survenue.')
    } finally {
      setSaving(false)
    }
  }

  const StepIcon = STEPS[step].icon
  const progress = ((step + 1) / STEPS.length) * 100

  return (
    <div className="w-full space-y-6 py-6">
      {/* Progress bar */}
      <div className="space-y-4">
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center gap-2 justify-center">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${
                i < step
                  ? 'bg-primary text-white'
                  : i === step
                    ? 'bg-primary/20 text-primary ring-2 ring-primary'
                    : 'bg-muted text-muted-foreground'
              }`}
            >
              {i < step ? <Check className="h-4 w-4" /> : i + 1}
            </div>
          ))}
        </div>
      </div>

      {/* Step header */}
      <div className="text-center space-y-2">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
          <StepIcon className="h-7 w-7 text-primary" />
        </div>
        <h1 className="text-xl font-bold">{STEPS[step].title}</h1>
        <p className="text-sm text-muted-foreground">{STEPS[step].subtitle}</p>
      </div>

      {/* Step content */}
      <div className="space-y-4">
        {step === 0 && (
          <>
            <Input
              id="username"
              label="Pseudo"
              placeholder="tonpseudo"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <Input
              id="full_name"
              label="Nom complet"
              placeholder="Jean Dupont"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
            <Input
              id="city"
              label="Ville"
              placeholder="Paris, Nice, Lyon..."
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </>
        )}

        {step === 1 && (
          <>
            <Select
              id="level"
              label="Ton niveau (1 à 10)"
              options={LEVEL_OPTIONS}
              value={level}
              onChange={(e) => setLevel(e.target.value)}
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
              onChange={(e) => setDominantHand(e.target.value)}
            />
          </>
        )}

        {step === 2 && (
          <>
            <Select
              id="preferred_side"
              label="Côté préféré"
              options={SIDE_OPTIONS}
              value={preferredSide}
              onChange={(e) => setPreferredSide(e.target.value)}
            />
            <div className="grid grid-cols-2 gap-4">
              <Select
                id="play_style"
                label="Style de jeu"
                options={STYLE_OPTIONS}
                value={playStyle}
                onChange={(e) => setPlayStyle(e.target.value)}
              />
              <Select
                id="goal"
                label="Objectif"
                options={GOAL_OPTIONS}
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
              />
            </div>
            <Textarea
              id="bio"
              label="Bio (optionnel)"
              placeholder="Parle un peu de toi et de ton jeu..."
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
          </>
        )}
      </div>

      {/* Error */}
      {error && (
        <p className="text-sm text-destructive text-center">{error}</p>
      )}

      {/* Navigation */}
      <div className="flex gap-3">
        {step > 0 && (
          <Button variant="outline" onClick={handleBack} className="flex-1">
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
        )}

        {step < STEPS.length - 1 ? (
          <Button onClick={handleNext} className="flex-1">
            Suivant
            <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} loading={saving} className="flex-1">
            C&apos;est parti !
          </Button>
        )}
      </div>
    </div>
  )
}
