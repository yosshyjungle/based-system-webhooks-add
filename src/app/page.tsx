import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import DinoHome from '../components/DinoHome';

export default async function Home() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-sky-200 to-green-200">
      <DinoHome userId={userId} />
    </main>
  );
}
