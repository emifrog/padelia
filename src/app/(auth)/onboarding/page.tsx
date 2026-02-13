'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui'
import { ArrowLeft, ArrowRight, User, Target, Gamepad2, Check } from 'lucide-react'
import { geocodeCity } from '@/lib/utils/geocode'
import { StepIdentity } from '@/components/onboarding/StepIdentity'
import { StepLevel } from '@/components/onboarding/StepLevel'
import { StepStyle } from '@/components/onboarding/StepStyle'

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
          <StepIdentity
            username={username}
            fullName={fullName}
            city={city}
            onUsernameChange={setUsername}
            onFullNameChange={setFullName}
            onCityChange={setCity}
          />
        )}

        {step === 1 && (
          <StepLevel
            level={level}
            dominantHand={dominantHand}
            onLevelChange={setLevel}
            onDominantHandChange={setDominantHand}
          />
        )}

        {step === 2 && (
          <StepStyle
            preferredSide={preferredSide}
            playStyle={playStyle}
            goal={goal}
            bio={bio}
            onPreferredSideChange={setPreferredSide}
            onPlayStyleChange={setPlayStyle}
            onGoalChange={setGoal}
            onBioChange={setBio}
          />
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
