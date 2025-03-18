// app/layout.tsx
import './globals.css'
import 'bootstrap/dist/css/bootstrap.min.css'
import SessionCheckWrapper from './sessions/SessionWrapper'

export const metadata = {
  title: 'Face Dancers',
  description: 'A Photorealistic AI bot interaction over Twilio Video',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <SessionCheckWrapper>{children}</SessionCheckWrapper>
      </body>
    </html>
  );
}
