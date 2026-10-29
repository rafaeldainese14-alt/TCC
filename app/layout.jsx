import { Fredoka } from "next/font/google";
import "./globals.css";

const fredoka = Fredoka({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata = {
  title: "Talking Emoji",
  description: "Seu próprio Talking Emoji",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body className={fredoka.className}>{children}</body>
    </html>
  );
}