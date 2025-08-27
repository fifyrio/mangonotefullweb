import {NextIntlClientProvider} from 'next-intl';
import {getMessages} from 'next-intl/server';
import {ReactNode} from 'react';
 
type Props = {
  children: ReactNode;
  params: {locale: string};
};
 
export default async function LocaleLayout({
  children,
  params: {locale}
}: Props) {
  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();
 
  return (
    <NextIntlClientProvider messages={messages} locale={locale}>
      <div className="bg-dark-primary text-white min-h-screen">
        {children}
      </div>
    </NextIntlClientProvider>
  );
}