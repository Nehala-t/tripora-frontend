import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/Providers";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export const metadata: Metadata = {
  title: "Tripora",
  description: "Discover tours and activities around the world.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <ToastContainer
  position="top-right"
  autoClose={3000}
  theme="light"
/>
          <Navbar />
          {children}
          <Footer />
        </Providers>
      </body>
    </html>
  );
}