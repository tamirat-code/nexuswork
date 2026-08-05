// HeroSection.jsx (Part 1)
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-[#09090B] text-white">
      {/* Animated background */}
      <div className="absolute inset-0 -z-10">
        <motion.div
          className="absolute top-10 left-10 h-72 w-72 rounded-full bg-blue-600/30 blur-3xl"
          animate={{
            x: [0, 40, 0],
            y: [0, -30, 0],
          }}
          transition={{
            repeat: Infinity,
            duration: 10,
            ease: "easeInOut",
          }}
        />

        <motion.div
          className="absolute right-0 top-1/3 h-80 w-80 rounded-full bg-violet-600/30 blur-3xl"
          animate={{
            x: [0, -50, 0],
            y: [0, 40, 0],
          }}
          transition={{
            repeat: Infinity,
            duration: 12,
            ease: "easeInOut",
          }}
        />
      </div>

      <div className="mx-auto flex min-h-[90vh] max-w-7xl flex-col items-center justify-between gap-16 px-6 py-24 lg:flex-row">
        {/* Left side */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
          className="max-w-2xl"
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-white/5 px-4 py-2 text-sm backdrop-blur-md">
            <Sparkles className="h-4 w-4 text-cyan-400" />
            AI Powered Student Freelance Marketplace
          </div>

          <h1 className="text-5xl font-bold leading-tight md:text-6xl">
            Find
            <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-500 bg-clip-text text-transparent">
              {" "}
              Verified Student Talent
            </span>
            <br />
            Build. Learn. Earn.
          </h1>

          <p className="mt-8 text-lg text-zinc-300">
            Connect with talented university students, discover freelance
            opportunities, and collaborate using AI-powered matching,
            university verification, and secure milestone payments.
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              to="/projects"
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-7 py-4 font-semibold transition hover:scale-105"
            >
              Explore Projects
              <ArrowRight size={18} />
            </Link>

            <Link
              to="/register"
              className="rounded-xl border border-zinc-700 bg-white/5 px-7 py-4 font-semibold backdrop-blur-lg transition hover:border-cyan-400"
            >
              Become a Freelancer
            </Link>
          </div>

          <div className="mt-12 flex flex-wrap gap-8">
            <div>
              <h2 className="text-3xl font-bold text-cyan-400">5K+</h2>
              <p className="text-zinc-400">Verified Students</p>
            </div>

            <div>
              <h2 className="text-3xl font-bold text-cyan-400">1.2K+</h2>
              <p className="text-zinc-400">Projects Posted</p>
            </div>

            <div>
              <h2 className="text-3xl font-bold text-cyan-400">98%</h2>
              <p className="text-zinc-400">AI Match Accuracy</p>
            </div>
          </div>

          <div className="mt-8 inline-flex items-center gap-2 text-green-400">
            <ShieldCheck size={18} />
            University Verified Freelancers
          </div>
        </motion.div>

        {/* Right side */}
<div className="relative flex h-[520px] w-full max-w-xl items-center justify-center">

{/* Main dashboard */}
<motion.div
  initial={{ opacity: 0, scale: 0.8 }}
  animate={{ opacity: 1, scale: 1 }}
  transition={{ duration: 0.8 }}
  className="relative z-10 w-full rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl"
>

  {/* Dashboard header */}
  <div className="flex items-center justify-between">
    <div>
      <p className="text-sm text-zinc-400">
        AI Talent Matching
      </p>

      <h3 className="text-xl font-bold">
        Recommended Freelancer
      </h3>
    </div>

    <div className="rounded-full bg-green-500/20 px-3 py-1 text-sm text-green-400">
      98% Match
    </div>
  </div>


  {/* Profile card */}
  <motion.div
    animate={{
      y: [0, -10, 0],
    }}
    transition={{
      repeat: Infinity,
      duration: 5,
    }}
    className="mt-8 rounded-2xl border border-white/10 bg-black/30 p-5"
  >

    <div className="flex items-center gap-4">

      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-cyan-400 to-blue-600 text-xl font-bold">
        DA
      </div>

      <div>
        <h4 className="font-semibold">
          Dawit A.
        </h4>

        <p className="text-sm text-zinc-400">
          Full Stack Developer
        </p>
      </div>

    </div>


    <div className="mt-5 flex flex-wrap gap-2">

      {[
        "React",
        "Node.js",
        "MongoDB",
        "AI"
      ].map((skill)=>(
        <span
          key={skill}
          className="rounded-full bg-white/10 px-3 py-1 text-xs text-cyan-300"
        >
          {skill}
        </span>
      ))}

    </div>


    <div className="mt-6 flex justify-between">

      <div>
        <p className="text-sm text-zinc-400">
          Rating
        </p>
        <p className="font-bold">
          ⭐ 4.9
        </p>
      </div>


      <div>
        <p className="text-sm text-zinc-400">
          Earnings
        </p>
        <p className="font-bold text-green-400">
          $2,450
        </p>
      </div>


    </div>

  </motion.div>


  {/* AI matching animation */}
  <motion.div
    animate={{
      x:[0,15,0],
    }}
    transition={{
      repeat:Infinity,
      duration:4
    }}
    className="mt-6 rounded-xl border border-cyan-400/20 bg-cyan-400/10 p-4"
  >

    <div className="flex items-center gap-3">

      <Sparkles className="text-cyan-400"/>

      <div>
        <p className="font-semibold">
          AI Recommendation
        </p>

        <p className="text-sm text-zinc-300">
          Best match found for your project
        </p>
      </div>

    </div>

  </motion.div>


</motion.div>



{/* Floating mini cards */}

<motion.div
  animate={{
    y:[0,-20,0]
  }}
  transition={{
    repeat:Infinity,
    duration:6
  }}
  className="absolute -right-8 top-16 rounded-2xl border border-white/10 bg-white/10 px-5 py-4 backdrop-blur-lg"
>

  <p className="text-sm text-zinc-300">
    Active Projects
  </p>

  <p className="text-2xl font-bold text-cyan-400">
    247
  </p>

</motion.div>



<motion.div
  animate={{
    y:[0,20,0]
  }}
  transition={{
    repeat:Infinity,
    duration:7
  }}
  className="absolute -left-10 bottom-20 rounded-2xl border border-white/10 bg-white/10 px-5 py-4 backdrop-blur-lg"
>

  <p className="text-sm text-zinc-300">
    Students Online
  </p>

  <p className="text-2xl font-bold text-violet-400">
    5,320
  </p>

</motion.div>


</div>
      </div>
    </section>
  );
}