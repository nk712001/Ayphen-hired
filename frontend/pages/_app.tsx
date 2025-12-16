import { AppProps } from 'next/app';
import { Providers } from '@/components/providers';

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <Providers>
      <Component {...pageProps} />
    </Providers>
  );
}
