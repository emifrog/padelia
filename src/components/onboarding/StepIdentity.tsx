import { Input } from '@/components/ui'

interface StepIdentityProps {
  username: string
  fullName: string
  city: string
  onUsernameChange: (value: string) => void
  onFullNameChange: (value: string) => void
  onCityChange: (value: string) => void
}

export function StepIdentity({
  username,
  fullName,
  city,
  onUsernameChange,
  onFullNameChange,
  onCityChange,
}: StepIdentityProps) {
  return (
    <>
      <Input
        id="username"
        label="Pseudo"
        placeholder="tonpseudo"
        value={username}
        onChange={(e) => onUsernameChange(e.target.value)}
      />
      <Input
        id="full_name"
        label="Nom complet"
        placeholder="Jean Dupont"
        value={fullName}
        onChange={(e) => onFullNameChange(e.target.value)}
      />
      <Input
        id="city"
        label="Ville"
        placeholder="Paris, Nice, Lyon..."
        value={city}
        onChange={(e) => onCityChange(e.target.value)}
      />
    </>
  )
}
