import React from "react";
import Link from "next/link";
import img from "../../public/images/about/about-hero.jpg"
import { 
  Compass, 
  ShieldCheck, 
  Users, 
  Globe, 
  Award, 
  HeartHandshake, 
  ArrowRight,
  CheckCircle2
} from "lucide-react";
import { useDispatch } from "react-redux";
import { useAppDispatch } from "@/redux/hooks"; // replace path with your redux hooks file
export default function AboutPage() {
  const stats = [
    { label: "Happy Travelers", value: "150K+" },
    { label: "Destinations Covered", value: "120+" },
    { label: "Partner Hotels & Resorts", value: "4,500+" },
    { label: "24/7 Support Rate", value: "99.8%" },
  ];

  const values = [
    {
      icon: <Globe className="w-6 h-6 text-blue-600" />,
      title: "Curated Global Experiences",
      description: "We handpick every destination, hotel, and activity to ensure you get authentic, top-tier travel experiences."
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-blue-600" />,
      title: "Trust & Transparency",
      description: "No hidden fees, transparent booking policies, and secure 256-bit encrypted payment gateways."
    },
    {
      icon: <HeartHandshake className="w-6 h-6 text-blue-600" />,
      title: "Traveler-First Support",
      description: "Our dedicated travel experts are available around the clock to assist you before, during, and after your trip."
    },
  ];

  const team = [
    {
      name: "Aarav Sharma",
      role: "Founder & CEO",
      image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400"
    },
    {
      name: "Ananya Iyer",
      role: "Head of Global Partnerships",
      image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=400"
    },
    {
      name: "Rohan Verma",
      role: "Chief Technology Officer",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400"
    },
  ];

  return (
    <div className="bg-slate-50 min-h-screen">
      
     {/* HERO SECTION */}
{/* HERO SECTION */}
<section className="relative flex min-h-[300px] items-center justify-center overflow-hidden bg-indigo-950 py-14 sm:min-h-[340px]">
  {/* Background Image */}
  <div className="absolute inset-0">
    <img
      src={img.src}
      alt="Travel background"
      className="h-full w-full object-cover"
    />
  </div>

  {/* Light Gradient Overlay */}
  <div className="absolute inset-0 bg-gradient-to-r from-indigo-950/60 via-blue-950/30 to-indigo-950/60" />

  {/* Content */}
  <div className="relative z-10 mx-auto max-w-4xl px-4 text-center">
    <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-white backdrop-blur-sm">
      <Compass className="h-4 w-4" />
      About TripOra
    </span>

      <h1 className="text-4xl font-black tracking-tight text-white sm:text-6xl lg:text-7xl">
  About TripOra
</h1>

    <p className="mx-auto mt-3 max-w-xl text-sm text-white/90 sm:text-base">
      Making every journey simple, memorable, and unforgettable.
    </p>
  </div>
</section>

      {/* Stats Bar */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-20">
        <div className="bg-white rounded-2xl shadow-xl border border-blue-100 grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-100 py-8 px-6 text-center">
          {stats.map((stat, index) => (
            <div key={index} className="py-4 md:py-0 px-4">
              <p className="text-3xl sm:text-4xl font-extrabold text-blue-900">{stat.value}</p>
              <p className="text-sm text-slate-500 font-medium mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Our Story / Mission */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-xs font-bold text-blue-600 uppercase tracking-widest">Our Mission</h2>
            <h3 className="text-3xl font-extrabold text-slate-900 leading-tight">
              Empowering travelers to discover the world on their own terms.
            </h3>
            <p className="text-slate-600 leading-relaxed">
              Founded in Bangalore, TripOra connects travelers with breathtaking destinations like Interlaken, Rome, Tokyo, and Maui. Whether you are looking for high-adrenaline outdoor adventures, peaceful cultural immersions, or relaxing culinary getaways, we handle the logistics so you can focus on creating memories.
            </p>
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3 text-slate-700 font-medium text-sm">
                <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />
                <span>Handpicked luxury & boutique accommodations</span>
              </div>
              <div className="flex items-center gap-3 text-slate-700 font-medium text-sm">
                <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />
                <span>Customized itineraries for solo travelers and families</span>
              </div>
              <div className="flex items-center gap-3 text-slate-700 font-medium text-sm">
                <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />
                <span>Guaranteed best price and flexible cancellation policies</span>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl blur-lg opacity-25" />
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white">
              <img 
                src="https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&q=80&w=800" 
                alt="Travelers exploring" 
                className="w-full h-[400px] object-cover hover:scale-105 transition-transform duration-500"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="bg-blue-50/50 border-y border-blue-100 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <h2 className="text-xs font-bold text-blue-600 uppercase tracking-widest">Why Choose Us</h2>
            <h3 className="text-3xl font-extrabold text-slate-900">Built on Trust and Passion</h3>
            <p className="text-slate-600">We go above and beyond to redefine your travel booking experience.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {values.map((v, i) => (
              <div key={i} className="bg-white p-8 rounded-2xl shadow-sm border border-blue-100 hover:shadow-md transition-shadow">
                <div className="p-3 bg-blue-50 w-fit rounded-xl mb-6">
                  {v.icon}
                </div>
                <h4 className="text-lg font-bold text-slate-900 mb-2">{v.title}</h4>
                <p className="text-slate-600 text-sm leading-relaxed">{v.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Leadership Team */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <h2 className="text-xs font-bold text-blue-600 uppercase tracking-widest">The Minds Behind TripOra</h2>
          <h3 className="text-3xl font-extrabold text-slate-900">Meet Our Leadership Team</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {team.map((member, idx) => (
            <div key={idx} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 group">
              <div className="h-72 overflow-hidden relative">
                <img 
                  src={member.image} 
                  alt={member.name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-6 text-center">
                <h4 className="text-lg font-bold text-slate-900">{member.name}</h4>
                <p className="text-sm text-blue-600 font-medium mt-1">{member.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Call to Action */}
      <section className="bg-blue-600 text-white py-16 px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <h2 className="text-3xl font-extrabold tracking-tight">Ready to Start Your Next Adventure?</h2>
          <p className="text-blue-100 text-sm sm:text-base max-w-xl mx-auto">
            Explore thousands of breathtaking destinations and handpicked activities designed just for you.
          </p>
          <div className="pt-2">
            <Link
              href="/destinations"
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-white text-blue-600 hover:bg-blue-50 font-bold rounded-xl shadow-lg transition-colors text-sm"
            >
              <span>Explore Destinations</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}