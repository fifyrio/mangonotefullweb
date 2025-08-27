import {NextIntlClientProvider} from 'next-intl';
import {getMessages} from 'next-intl/server';
import {setRequestLocale} from 'next-intl/server';
import {ReactNode} from 'react';
import {routing} from '@/i18n/routing';
 
type Props = {
  children: ReactNode;
  params: Promise<{locale: string}>;
};
 
export default async function LocaleLayout({
  children,
  params
}: Props) {
  const {locale} = await params;
  
  // Enable static rendering
  setRequestLocale(locale);
  
  // Providing all messages to the client
  const messages = await getMessages();
 
  return (
    <NextIntlClientProvider messages={messages}>
      <div className="bg-dark-primary text-white min-h-screen">
        {children}
      </div>
    </NextIntlClientProvider>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({locale}));
}