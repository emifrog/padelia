interface ScoreWinnerProps {
  winnerTeam: 1 | 2 | null
}

export function ScoreWinner({ winnerTeam }: ScoreWinnerProps) {
  return (
    <div className="border-t border-border pt-3 text-center">
      {winnerTeam ? (
        <p className="text-sm font-semibold">
          {'🏆'} Victoire{' '}
          <span className={winnerTeam === 1 ? 'text-primary' : 'text-secondary'}>
            Équipe {winnerTeam}
          </span>
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">Égalité</p>
      )}
    </div>
  )
}
