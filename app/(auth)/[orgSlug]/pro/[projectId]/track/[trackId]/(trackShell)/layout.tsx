import { TrackShellLayout } from '@/components/tracks/track-shell-layout'

export default function Layout({ children }: { children: React.ReactNode }) {
  return <TrackShellLayout>{children}</TrackShellLayout>
}
