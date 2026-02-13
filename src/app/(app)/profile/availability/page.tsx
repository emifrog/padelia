'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Trash2, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Header } from '@/components/layout/Header'
import { Button, Card, Modal, Badge } from '@/components/ui'
import { AvailabilityForm } from '@/components/forms/AvailabilityForm'
import type { Availability } from '@/types'
import type { AvailabilityFormValues } from '@/lib/validations/availability'

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']

export default function AvailabilityPage() {
  const router = useRouter()
  const [slots, setSlots] = useState<Availability[]>([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)

  const loadSlots = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('availability')
      .select('*')
      .eq('player_id', user.id)
      .order('day_of_week')
      .order('start_time')

    if (data) setSlots(data as Availability[])
    setLoading(false)
  }, [])

  useEffect(() => {
    loadSlots()
  }, [loadSlots])

  async function handleAdd(data: AvailabilityFormValues) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from('availability').insert({
      player_id: user.id,
      day_of_week: data.day_of_week,
      start_time: data.start_time,
      end_time: data.end_time,
      is_recurring: true,
    })

    if (error) throw new Error("Erreur lors de l'ajout du créneau.")

    setShowForm(false)
    loadSlots()
  }

  async function handleDelete(id: string) {
    const supabase = createClient()
    await supabase.from('availability').delete().eq('id', id)
    setSlots((prev) => prev.filter((s) => s.id !== id))
  }

  // Group by day
  const byDay = DAYS.map((day, idx) => ({
    day,
    dayIndex: idx,
    items: slots.filter((s) => s.day_of_week === idx),
  })).filter((g) => g.items.length > 0)

  return (
    <>
      <Header title="Mes disponibilités">
        <button
          onClick={() => router.back()}
          className="rounded-lg p-2 text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
      </Header>

      <div className="p-4 space-y-4">
        <Button className="w-full" onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4" />
          Ajouter un créneau
        </Button>

        {loading ? (
          <p className="text-center text-muted-foreground py-8">Chargement...</p>
        ) : byDay.length === 0 ? (
          <Card className="text-center py-8">
            <Clock className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Aucune disponibilité définie.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Ajoute tes créneaux pour que les joueurs te trouvent.
            </p>
          </Card>
        ) : (
          byDay.map(({ day, items }) => (
            <Card key={day}>
              <h3 className="font-semibold mb-3">{day}</h3>
              <div className="space-y-2">
                {items.map((slot) => (
                  <div
                    key={slot.id}
                    className="flex items-center justify-between rounded-lg bg-muted p-3"
                  >
                    <div className="flex items-center gap-2">
                      <Badge>
                        {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                      </Badge>
                    </div>
                    <button
                      onClick={() => handleDelete(slot.id)}
                      className="rounded-lg p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </Card>
          ))
        )}
      </div>

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Nouveau créneau">
        <AvailabilityForm onSubmit={handleAdd} onCancel={() => setShowForm(false)} />
      </Modal>
    </>
  )
}
