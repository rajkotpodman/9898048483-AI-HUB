import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: '9898048483 AI Hub',
  description: 'An all-in-one hub for managing and accessing various AI services.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                if (typeof window !== 'undefined') {
                  ['fetch', 'Headers', 'Request', 'Response', 'FormData'].forEach(function(prop) {
                    try {
                      var current = window[prop];
                      Object.defineProperty(window, prop, {
                        get: function() { return current; },
                        set: function(v) { current = v; },
                        configurable: true,
                        enumerable: true
                      });
                    } catch(e) {}
                  });
                }
              })();
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}

