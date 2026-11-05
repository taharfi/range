import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
const geist=localFont({src:"./fonts/geist-latin.woff2",variable:"--font-geist",display:"swap",weight:"100 900"});
const mono=localFont({src:"./fonts/geist-mono-latin.woff2",variable:"--font-geist-mono",display:"swap",weight:"100 900"});
export const metadata: Metadata = {
  title:"range. — Know your position.",
  description:"Liquidity intelligence for Meteora LPs, with Jupiter-powered execution analysis. Read-only private pilot.",
  robots:{index:false,follow:false}
};
export default function Layout({children}:{children:React.ReactNode}) {
  return <html lang="en" className={`${geist.variable} ${mono.variable}`}><body>{children}</body></html>;
}
