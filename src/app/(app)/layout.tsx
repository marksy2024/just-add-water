import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { Header } from '@/components/layout/Header'
import { BottomNav } from '@/components/layout/BottomNav'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  return (
    <>
      <Header />
      <main className="max-w-2xl mx-auto px-4 pb-20 pt-4">
        {children}
      </main>
      <BottomNav />
    </>
  )
}
