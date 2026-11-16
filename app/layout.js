import './globals.css';

export const metadata = {
  title: 'אלבום המשפחה',
  description: 'אלבום משפחתי חם וחי',
};

export default function RootLayout({ children }) {
  return (
    <html lang="he" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
