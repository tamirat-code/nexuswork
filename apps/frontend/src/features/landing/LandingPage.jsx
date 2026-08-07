import { motion } from "framer-motion";
import {
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Users,
  Briefcase,
  Brain,
  CheckCircle,
} from "lucide-react";
import { Link } from "react-router-dom";

export default function LandingPage() {
  return (
    <div className="overflow-hidden bg-[#09090B] text-white">


      {/* ================= HERO SECTION ================= */}

      <section className="relative">

        {/* Animated background */}

        <div className="absolute inset-0 -z-10">

          <motion.div
            className="absolute left-10 top-20 h-72 w-72 rounded-full bg-blue-600/30 blur-3xl"
            animate={{
              x:[0,40,0],
              y:[0,-30,0]
            }}
            transition={{
              duration:10,
              repeat:Infinity
            }}
          />


          <motion.div
            className="absolute right-10 top-40 h-80 w-80 rounded-full bg-violet-600/30 blur-3xl"
            animate={{
              x:[0,-40,0],
              y:[0,40,0]
            }}
            transition={{
              duration:12,
              repeat:Infinity
            }}
          />

        </div>



        <div className="
          mx-auto flex min-h-[90vh] max-w-7xl
          flex-col items-center justify-between
          gap-16 px-6 py-24
          lg:flex-row
        ">


          {/* LEFT CONTENT */}

          <motion.div
            initial={{
              opacity:0,
              x:-50
            }}
            animate={{
              opacity:1,
              x:0
            }}
            transition={{
              duration:.7
            }}
            className="max-w-2xl"
          >


            <div className="
              mb-6 inline-flex items-center gap-2
              rounded-full border border-blue-400/30
              bg-white/5 px-4 py-2
              text-sm backdrop-blur
            ">

              <Sparkles 
                size={16}
                className="text-cyan-400"
              />

              AI Powered Student Freelance Marketplace

            </div>



            <h1 className="
              text-5xl font-bold leading-tight
              md:text-6xl
            ">

              Connect

              <span className="
                bg-gradient-to-r
                from-cyan-400
                via-blue-500
                to-violet-500
                bg-clip-text
                text-transparent
              ">
                {" "}Student Talent
              </span>

              <br/>

              Build. Learn. Earn.

            </h1>



            <p className="
              mt-8 text-lg
              text-zinc-300
            ">

              CampusConnect helps university students
              discover freelance opportunities,
              showcase their skills, and collaborate
              through AI-powered matching.

            </p>




            <div className="mt-10 flex flex-wrap gap-4">


              <Link
                to="/projects"
                className="
                  flex items-center gap-2
                  rounded-xl
                  bg-gradient-to-r
                  from-blue-600
                  to-cyan-500
                  px-7 py-4
                  font-semibold
                  transition
                  hover:scale-105
                "
              >

                Explore Projects

                <ArrowRight size={18}/>

              </Link>



              <Link
                to="/register"
                className="
                  rounded-xl
                  border border-zinc-700
                  bg-white/5
                  px-7 py-4
                  font-semibold
                  transition
                  hover:border-cyan-400
                "
              >

                Become Freelancer

              </Link>


            </div>



            {/* Stats */}

            <div className="
              mt-12 flex flex-wrap gap-10
            ">


              <div>
                <h3 className="text-3xl font-bold text-cyan-400">
                  5K+
                </h3>

                <p className="text-zinc-400">
                  Students
                </p>
              </div>



              <div>
                <h3 className="text-3xl font-bold text-cyan-400">
                  1.2K+
                </h3>

                <p className="text-zinc-400">
                  Projects
                </p>
              </div>



              <div>
                <h3 className="text-3xl font-bold text-cyan-400">
                  98%
                </h3>

                <p className="text-zinc-400">
                  Match Rate
                </p>
              </div>


            </div>




            <div className="
              mt-8 flex items-center gap-2
              text-green-400
            ">

              <ShieldCheck size={18}/>

              Verified University Students

            </div>


          </motion.div>





          {/* RIGHT DASHBOARD */}


          <motion.div
            initial={{
              opacity:0,
              scale:.8
            }}
            animate={{
              opacity:1,
              scale:1
            }}
            className="
              relative flex
              h-[500px]
              w-full
              max-w-xl
              items-center
              justify-center
            "
          >



            {/* Main card */}

            <div className="
              w-full rounded-3xl
              border border-white/10
              bg-white/5
              p-6
              backdrop-blur-xl
              shadow-2xl
            ">


              <div className="
                flex justify-between
              ">

                <div>

                  <p className="text-sm text-zinc-400">
                    AI Matching
                  </p>

                  <h2 className="text-xl font-bold">
                    Best Freelancer Found
                  </h2>

                </div>


                <span className="
                  rounded-full
                  bg-green-500/20
                  px-3 py-1
                  text-sm
                  text-green-400
                ">
                  98%
                </span>


              </div>




              <motion.div
                animate={{
                  y:[0,-10,0]
                }}
                transition={{
                  repeat:Infinity,
                  duration:5
                }}
                className="
                  mt-8 rounded-2xl
                  bg-black/30
                  p-5
                "
              >

                <div className="
                  flex items-center gap-4
                ">

                  <div className="
                    flex h-14 w-14
                    items-center justify-center
                    rounded-full
                    bg-gradient-to-r
                    from-cyan-400
                    to-blue-600
                    font-bold
                  ">

                    DA

                  </div>


                  <div>

                    <h3 className="font-semibold">
                      Student Developer
                    </h3>

                    <p className="text-sm text-zinc-400">
                      Full Stack Engineer
                    </p>

                  </div>

                </div>



                <div className="
                  mt-5 flex flex-wrap gap-2
                ">

                  {
                    ["React","Node","MongoDB","AI"]
                    .map(skill=>(
                      <span
                        key={skill}
                        className="
                          rounded-full
                          bg-white/10
                          px-3 py-1
                          text-xs
                          text-cyan-300
                        "
                      >
                        {skill}
                      </span>
                    ))
                  }

                </div>



                <div className="
                  mt-6 flex justify-between
                ">

                  <div>

                    <p className="text-sm text-zinc-400">
                      Rating
                    </p>

                    <p>
                      ⭐ 4.9
                    </p>

                  </div>


                  <div>

                    <p className="text-sm text-zinc-400">
                      Earned
                    </p>

                    <p className="text-green-400">
                      $2450
                    </p>

                  </div>


                </div>


              </motion.div>





              <div className="
                mt-6 flex items-center gap-3
                rounded-xl
                bg-cyan-400/10
                p-4
              ">

                <Brain className="text-cyan-400"/>

                <p>
                  AI found the perfect project match
                </p>

              </div>


            </div>

          </motion.div>


        </div>

      </section>







      {/* ================= FEATURES ================= */}


      <section className="
        mx-auto max-w-7xl
        px-6 py-24
      ">


        <h2 className="
          text-center
          text-4xl
          font-bold
        ">
          Why CampusConnect?
        </h2>



        <div className="
          mt-12 grid gap-8
          md:grid-cols-3
        ">


          {[
            {
              icon:<Brain/>,
              title:"AI Matching",
              text:"Find the right students for every project."
            },
            {
              icon:<Users/>,
              title:"Student Network",
              text:"Connect with talented university students."
            },
            {
              icon:<Briefcase/>,
              title:"Real Projects",
              text:"Gain experience and earn while learning."
            }

          ].map((item)=>(
            <div
              key={item.title}
              className="
                rounded-2xl
                border border-white/10
                bg-white/5
                p-8
              "
            >

              <div className="text-cyan-400">
                {item.icon}
              </div>


              <h3 className="mt-5 text-xl font-bold">
                {item.title}
              </h3>


              <p className="
                mt-3 text-zinc-400
              ">
                {item.text}
              </p>


            </div>
          ))}


        </div>

      </section>





      {/* ================= CTA ================= */}


      <section className="
        mx-auto max-w-5xl
        px-6 pb-24
      ">


        <div className="
          rounded-3xl
          border border-cyan-400/20
          bg-gradient-to-r
          from-blue-600/20
          to-violet-600/20
          p-12
          text-center
        ">


          <CheckCircle
            className="
              mx-auto
              text-cyan-400
            "
          />


          <h2 className="
            mt-5
            text-4xl
            font-bold
          ">
            Ready to build your future?
          </h2>


          <p className="
            mt-4 text-zinc-300
          ">
            Join students building skills,
            projects, and careers together.
          </p>



          <Link
            to="/register"
            className="
              mt-8
              inline-block
              rounded-xl
              bg-cyan-500
              px-8 py-4
              font-bold
            "
          >

            Join CampusConnect

          </Link>


        </div>


      </section>


    </div>
  );
}