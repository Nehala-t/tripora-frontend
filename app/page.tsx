"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import AllDestination from "@/components/AllDestination";
import FeaturedTrips from "@/components/FeaturedTrips";
import { 
  MapPin, 
  Calendar, 
  Users, 
  Search, 
  ArrowRight,
  Star,
  ChevronRight
} from "lucide-react";
import {
  FiArrowUpRight,
} from "react-icons/fi";
import heroImage from "../public/images/hero/heroImage 1.jpg";
import img from "../public/images/hero/hr.png"

export default function HomePage() {
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
  const [guests, setGuests] = useState("2 People");

  // Sample Featured Destinations
  const featuredDestinations = [
    {
      id: "1",
      name: "Interlaken",
      country: "Switzerland",
      region: "Bernese Oberland",
      rating: 4.9,
      price: "₹45,000",
      image: "https://images.unsplash.com/photo-1527668733077-44f3b141753c?auto=format&fit=crop&q=80&w=600"
    },
    {
      id: "2",
      name: "Rome",
      country: "Italy",
      region: "Lazio",
      rating: 4.8,
      price: "₹38,000",
      image: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&q=80&w=600"
    },
    {
      id: "3",
      name: "Tokyo",
      country: "Japan",
      region: "Kanto",
      rating: 4.9,
      price: "₹65,000",
      image: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&q=80&w=600"
    }
  ];

  return (
    <div className="bg-slate-50 min-h-screen flex flex-col justify-between">
      <div>
        {/* ========================================
            HERO SECTION
        ======================================== */}
        <section className="relative flex min-h-screen w-full flex-col justify-between overflow-hidden bg-slate-950 text-white lg:min-h-[800px]">

  {/* Background Image */}
  <div className="absolute inset-0 z-0">
    <Image
      src={heroImage}
      alt="Natural Wonders Background"
      fill
      priority
      sizes="100vw"
      className="object-cover object-center"
    />

    <div className="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-slate-950/20 to-slate-950/85" />
  </div>

  {/* Decorative Image Layer - similar to your reference */}
  <div className="pointer-events-none absolute inset-0 z-[1]">
    <Image
      src={img}
      alt=""
      fill
      priority
      sizes="100vw"
      className="object-cover object-center opacity-75 mix-blend-screen z-10"
    />
  </div>

  {/* Giant Background Text */}
{/* Giant Adventure Text */}
  {/* Text on top */}
<div className="absolute inset-0 flex items-center justify-center translate-y-8 sm:translate-y-10 md:translate-y-12 lg:translate-y-16 px-2 sm:px-3">
  <div className="flex w-full min-w-0 flex-col items-center">
    <h2 className="w-full text-center text-white leading-none">
      <span className="uppercase text-sm tracking-[2px] sm:text-lg sm:tracking-[3px] md:text-2xl md:tracking-[8px]">
        Discover Your Next
      </span>

      <br />

      <span className="block w-full whitespace-nowrap text-[16vw] sm:text-[10vw] md:text-[13vw] lg:text-[12vw] xl:text-[11vw] font-coastal-clean tracking-normal">
        ADVENTURE
      </span>
    </h2>
  </div>
</div>{/* Hero Content */}
 
</section>

        {/* ========================================
            FEATURED DESTINATIONS SECTION
        ======================================== */}
       <AllDestination />
       <FeaturedTrips />
      </div>

    </div>
  );
}