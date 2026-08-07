export const PORTFOLIO = {
  hero: {
    name: "Selam M.",
    title: "Full-Stack Developer · React & Node.js Specialist",
    bio: "University-verified senior software engineering student with a passion for building clean, performant web applications. Specialized in React, Node.js, and data visualization. 3+ years of freelance experience with 21 completed contracts.",
    university: "Addis Ababa Institute of Technology",
    year: "Year 4",
    location: "Addis Ababa, Ethiopia",
    responseTime: "< 2 hours",
    hireRate: "94%",
  },
  stats: {
    completed: 21,
    totalEarnings: 8420,
    avgRating: 4.9,
    reviews: 47,
  },
  skills: [
    { name: "React", level: 95, verified: true },
    { name: "Node.js", level: 88, verified: true },
    { name: "TypeScript", level: 85, verified: true },
    { name: "Tailwind CSS", level: 92, verified: true },
    { name: "MongoDB", level: 78, verified: true },
    { name: "PostgreSQL", level: 70, verified: false },
    { name: "Docker", level: 65, verified: false },
    { name: "AWS", level: 60, verified: false },
  ],
  caseStudies: [
    {
      id: "cs-1",
      title: "University Event Management Web App",
      client: "Daniel T.",
      clientRating: 4.9,
      budget: 800,
      duration: "6 weeks",
      tags: ["React", "Node.js", "MongoDB"],
      summary:
        "Built a full-stack event management platform for campus clubs with ticket sales, attendee check-ins, and admin dashboard.",
      deliverables: [
        "Responsive UI",
        "Admin Panel",
        "Payment Integration",
        "Real-time Check-in",
      ],
      review:
        "Selam delivered exceptional work. Her code quality and communication were outstanding — I'd hire again in a heartbeat.",
      verified: true,
    },
    {
      id: "cs-2",
      title: "Student Performance Analytics Dashboard",
      client: "TechCorp NGO",
      clientRating: 5.0,
      budget: 1200,
      duration: "8 weeks",
      tags: ["React", "Recharts", "TypeScript", "REST API"],
      summary:
        "Designed and implemented a data visualization dashboard tracking student progress, attendance, and skill-gap analytics.",
      deliverables: [
        "Interactive Charts",
        "API Integration",
        "Export to PDF",
        "Role-based Access",
      ],
      review:
        "Absolutely phenomenal. The dashboard is now used by 3 departments and has transformed how we track student outcomes.",
      verified: true,
    },
    {
      id: "cs-3",
      title: "Campus Marketplace UI/UX Design",
      client: "Innovation Hub",
      clientRating: 5.0,
      budget: 600,
      duration: "3 weeks",
      tags: ["Figma", "UI/UX", "Prototyping"],
      summary:
        "Created high-fidelity prototypes for a peer-to-peer campus marketplace with 40+ screens and comprehensive design system.",
      deliverables: [
        "Design System",
        "40+ Screens",
        "Clickable Prototype",
        "Documentation",
      ],
      review:
        "Incredible attention to detail. The prototypes exceeded our expectations and the handoff to developers was flawless.",
      verified: true,
    },
  ],
  education: [
    {
      degree: "B.Sc. Software Engineering",
      institution: "AAiT",
      year: "2023 – 2027",
      cgpa: 3.85,
    },
  ],
  certificates: [
    { name: "React Advanced Patterns", issuer: "NexusWork", date: "2026-06" },
    { name: "Node.js Certification", issuer: "AAiT", date: "2026-03" },
    { name: "UI/UX Fundamentals", issuer: "Coursera", date: "2025-11" },
  ],
  reviews: [
    {
      client: "Daniel T.",
      rating: 5,
      date: "2026-08",
      project: "Event Web App",
      text: "Exceptional work — highly recommend.",
    },
    {
      client: "TechCorp NGO",
      rating: 5,
      date: "2026-07",
      project: "Analytics Dashboard",
      text: "Transformed our data workflow.",
    },
    {
      client: "Innovation Hub",
      rating: 5,
      date: "2026-06",
      project: "Marketplace UI/UX",
      text: "Incredible design quality.",
    },
    {
      client: "EduTech Startup",
      rating: 4,
      date: "2026-05",
      project: "Study Chatbot",
      text: "Solid implementation, minor delays.",
    },
  ],
};
