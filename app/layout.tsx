import type { Metadata, Viewport } from "next";
import {
  Cormorant_Garamond,
  Inter,
  Marck_Script,
  Montserrat,
  Playfair_Display,
} from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

const marck = Marck_Script({
  variable: "--font-marck",
  subsets: ["latin", "cyrillic"],
  weight: "400",
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "URILGA — Нэг линк. Мартагдашгүй мэдрэмж.",
    template: "%s · URILGA",
  },
  description:
    "Хурим, төрсөн өдөр, сэвлэг үргээх, төгсөлт болон бусад онцгой мөчдөө зориулсан дижитал урилгаа нэг линкээр бүтээгээрэй.",
};

export const viewport: Viewport = {
  themeColor: "#F8F5F0",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="mn"
      className={`${inter.variable} ${cormorant.variable} ${playfair.variable} ${montserrat.variable} ${marck.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
