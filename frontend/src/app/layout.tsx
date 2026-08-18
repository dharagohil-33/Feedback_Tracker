import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '../components/Providers';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';

export const metadata: Metadata = {
  title: 'AI Customer Feedback & Product Insights Tracker',
  description: 'AI-powered customer feedback processing, sentiment analysis, and product insights OS.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark h-full">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var savedTheme = localStorage.getItem('theme');
                  if (savedTheme === 'light') {
                    document.documentElement.classList.remove('dark');
                    document.documentElement.classList.add('light');
                  } else {
                    document.documentElement.classList.add('dark');
                    document.documentElement.classList.remove('light');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col md:flex-row font-sans antialiased bg-slate-50 text-slate-900 dark:bg-[#07080A] dark:text-slate-100">
        <Providers>
          <Sidebar />
          <div className="flex-1 flex flex-col min-h-screen w-full bg-slate-50 dark:bg-[#07080A]">
            <Header />
            <main className="flex-1 p-6 md:p-8 pt-20 md:pt-24">{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
