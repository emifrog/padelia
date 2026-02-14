'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Mail, Lock, User } from 'lucide-react';

export default function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          username: fullName.toLowerCase().replace(/\s+/g, '_').slice(0, 20),
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      toast.error(error.message === 'User already registered'
        ? 'Cet email est déjà utilisé'
        : 'Erreur lors de l\'inscription');
      setLoading(false);
      return;
    }

    toast.success('Compte créé ! Vérifie ton email pour confirmer.');
    router.push('/login');
  }

  return (
    <Card className="border-navy-mid bg-navy-light">
      <CardContent className="pt-6">
        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-gray-300">
              Nom complet
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <Input
                id="fullName"
                type="text"
                placeholder="Lucas Martin"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                minLength={2}
                className="border-navy-mid bg-navy pl-10 text-white placeholder:text-gray-500"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-gray-300">
              Email
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <Input
                id="email"
                type="email"
                placeholder="ton@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="border-navy-mid bg-navy pl-10 text-white placeholder:text-gray-500"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-gray-300">
              Mot de passe
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <Input
                id="password"
                type="password"
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="border-navy-mid bg-navy pl-10 text-white placeholder:text-gray-500"
              />
            </div>
            <p className="text-xs text-gray-500">Minimum 6 caractères</p>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-green-padel font-semibold hover:bg-green-padel-light"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Créer mon compte
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-400">
          Déjà un compte ?{' '}
          <Link href="/login" className="font-medium text-green-padel hover:underline">
            Se connecter
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
