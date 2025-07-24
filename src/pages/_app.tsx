import "@/styles/globals.css";
import type { AppProps } from "next/app";
import Image from "next/image";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      {/* Fixed logo at top-left - same as Rootcause project */}
      <div style={{
        position: 'absolute',
        left: '16px',
        top: '16px',
        width: '60px',
        height: '60px',
        zIndex: 1000
      }}>
        <Image 
          src="/Logo.png" 
          alt="Logo" 
          width={60} 
          height={60}
          style={{ objectFit: 'contain' }}
        />
      </div>
      <Component {...pageProps} />
    </>
  );
}
