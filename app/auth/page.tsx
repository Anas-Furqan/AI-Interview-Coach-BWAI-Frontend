import dynamic from 'next/dynamic';

const AuthPageClient = dynamic(() => import('./AuthPageClient'), {
  ssr: false,
  loading: () => null,
});

export default function AuthPage() {
  return <AuthPageClient />;
}
