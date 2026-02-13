'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Header } from '@/components/layout/Header'
import { Button, Input, Select, Textarea, Card } from '@/components/ui'

const TYPE_OPTIONS = [
  { value: 'friendly', label: 'Amical' },
  { value: 'ranked', label: 'Classé' },
]

export default function CreateMatchPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const formData = new FormData(e.currentTarget)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non connecté')

      const { data: matchData, error: insertError } = await supabase
        .from('matches')
        .insert({
          created_by: user.id,
          match_type: formData.get('match_type') as string,
          scheduled_at: formData.get('scheduled_at') as string,
          location_name: formData.get('location_name') as string,
          min_level: Number(formData.get('min_level')),
          max_level: Number(formData.get('max_level')),
          notes: (formData.get('notes') as string) || null,
          is_public: true,
        })
        .select('id')
        .single()

      if (insertError || !matchData) throw new Error("Erreur lors de la création du match.")

      // Auto-add creator as player in team 1
      await supabase.from('match_players').insert({
        match_id: matchData.id,
        player_id: user.id,
        team: 1,
        status: 'accepted',
      })

      router.push(`/matches/${matchData.id}`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Header title="Créer un match">
        <button
          onClick={() => router.back()}
          className="rounded-lg p-2 text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
      </Header>

      <div className="p-4">
        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              id="scheduled_at"
              label="Date et heure"
              name="scheduled_at"
              type="datetime-local"
              required
            />

            <Input
              id="location_name"
              label="Lieu"
              name="location_name"
              placeholder="Nom du club ou terrain"
              required
            />

            <Select
              id="match_type"
              label="Type de match"
              name="match_type"
              options={TYPE_OPTIONS}
              defaultValue="friendly"
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                id="min_level"
                label="Niveau min"
                name="min_level"
                type="number"
                min={1}
                max={10}
                step={0.5}
                defaultValue={1}
              />
              <Input
                id="max_level"
                label="Niveau max"
                name="max_level"
                type="number"
                min={1}
                max={10}
                step={0.5}
                defaultValue={10}
              />
            </div>

            <Textarea
              id="notes"
              label="Notes (optionnel)"
              name="notes"
              placeholder="Infos complémentaires..."
              rows={2}
            />

            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}

            <Button type="submit" className="w-full" loading={loading}>
              Publier le match
            </Button>
          </form>
        </Card>
      </div>
    </>
  )
}
