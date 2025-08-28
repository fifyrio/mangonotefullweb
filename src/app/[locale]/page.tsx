import { redirect } from 'next/navigation'

type Props = {
  params: Promise<{locale: string}>;
};

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  
  // Redirect to dashboard with locale
  redirect(`/${locale}/dashboard`);
}
