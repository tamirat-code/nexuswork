import selamAvatar from "../assets/images/freelancers/selam.png";
import danielAvatar from "../assets/images/freelancers/daniel.png";
import hannaAvatar from "../assets/images/freelancers/hanna.png";

import {
  ShieldCheck,
  Sparkles,
  Briefcase,
  Lock,
  FolderKanban,
  FileText,
  MessageSquare,
  ListChecks,
  GraduationCap,
  BookOpen,
  BarChart3,
  Award,
  UserPlus,
  UserCircle2,
  Wrench,
  Search,
  Send,
  CheckCircle2,
  Star,
  Folder,
  Building2,
  Landmark,
  HeartHandshake,
  Rocket,
} from "lucide-react";

// --- The rest of your file (export const trustedBy = [...]) stays exactly as it is ---

export const trustedBy = [
  {
    name: "Addis Tech University",
    icon: GraduationCap,
  },
  {
    name: "Nexus Digital Agency",
    icon: Building2,
  },
  {
    name: "Hope Development NGO",
    icon: HeartHandshake,
  },
  {
    name: "Innovation Startup Hub",
    icon: Rocket,
  },
  {
    name: "Public Service Digital Office",
    icon: Landmark,
  },
];

export const stats = [
  {
    label: "Verified Students",
    value: 12500,
    suffix: "+",
  },
  {
    label: "Active Projects",
    value: 3800,
    suffix: "+",
  },
  {
    label: "Completed Projects",
    value: 9200,
    suffix: "+",
  },
  {
    label: "Partner Universities",
    value: 42,
    suffix: "",
  },
  {
    label: "Clients",
    value: 850,
    suffix: "+",
  },
  {
    label: "Revenue Generated",
    value: 1.2,
    prefix: "$",
    suffix: "M+",
    decimals: 1,
  },
];

export const features = [
  {
    title: "Student Verification",
    description:
      "University staff verify student identity and enrollment status, giving clients stronger trust signals.",
    icon: ShieldCheck,
  },
  {
    title: "AI Skill Matching",
    description:
      "Intelligent matching connects students with projects based on skills, portfolio, availability, and career goals.",
    icon: Sparkles,
  },
  {
    title: "Project Marketplace",
    description:
      "Clients post projects, students submit proposals, and the best fit is selected through a transparent workflow.",
    icon: Briefcase,
  },
  {
    title: "Secure Escrow Payments",
    description:
      "Milestone-based escrow protects both clients and students until approved work is delivered.",
    icon: Lock,
  },
  {
    title: "Portfolio Builder",
    description:
      "Approved milestones can be added to a student portfolio automatically with client consent.",
    icon: FolderKanban,
  },
  {
    title: "Resume Generator",
    description:
      "Generate a professional resume from verified skills, completed projects, and university certifications.",
    icon: FileText,
  },
  {
    title: "Real-time Chat",
    description:
      "Contract-scoped messaging and file sharing keep all communication organized and dispute-ready.",
    icon: MessageSquare,
  },
  {
    title: "Milestone Tracking",
    description:
      "Track funding, delivery, revision requests, approvals, and payment release for every milestone.",
    icon: ListChecks,
  },
  {
    title: "University Certification",
    description:
      "Universities certify academic and practical skills, strengthening student credibility in the marketplace.",
    icon: GraduationCap,
  },
  {
    title: "Learning Resources",
    description:
      "Skill-gap insights route students toward training, courses, and certifications that improve employability.",
    icon: BookOpen,
  },
  {
    title: "Analytics Dashboard",
    description:
      "Administrators and universities view platform growth, popular skills, income trends, and employment outcomes.",
    icon: BarChart3,
  },
  {
    title: "Digital Certificates",
    description:
      "Verified achievements and completed project records can be issued as shareable digital credentials.",
    icon: Award,
  },
];

export const steps = [
  {
    title: "Register",
    description: "Create an account with your university email or student ID.",
    icon: UserPlus,
  },
  {
    title: "Verify University",
    description:
      "University staff confirm your identity and enrollment status.",
    icon: GraduationCap,
  },
  {
    title: "Build Profile",
    description: "Add your academic background, experience, and availability.",
    icon: UserCircle2,
  },
  {
    title: "Upload Skills",
    description: "Add structured skills and request university certification.",
    icon: Wrench,
  },
  {
    title: "Find Projects",
    description: "Browse projects or receive AI-recommended opportunities.",
    icon: Search,
  },
  {
    title: "Submit Proposal",
    description: "Send your bid, delivery time, and cover note to the client.",
    icon: Send,
  },
  {
    title: "Complete Work",
    description: "Deliver milestone outputs through the built-in workspace.",
    icon: CheckCircle2,
  },
  {
    title: "Receive Payment",
    description:
      "Approved milestone funds are released securely to your wallet.",
    icon: WalletIconFallback(),
  },
  {
    title: "Get Reviews",
    description: "Collect verified ratings and strengthen your reputation.",
    icon: Star,
  },
  {
    title: "Build Portfolio",
    description: "Turn approved work into portfolio items automatically.",
    icon: Folder,
  },
];

function WalletIconFallback() {
  return Lock;
}

export const projects = [
  {
    id: "1",
    title: "University Event Management Web App",
    description:
      "Build a responsive event management platform for campus clubs, departments, and student organizations.",
    budget: "$800",
    deadline: "Aug 20, 2026",
    rating: 4.9,
    skills: ["React", "Node.js", "MongoDB", "Tailwind CSS"],
  },
  {
    id: "2",
    title: "Student Performance Analytics Dashboard",
    description:
      "Design an analytics dashboard that visualizes course progress, grades, and skill development trends.",
    budget: "$1,200",
    deadline: "Sep 05, 2026",
    rating: 4.8,
    skills: ["Data Visualization", "React", "Express", "Charts"],
  },
  {
    id: "3",
    title: "Campus Marketplace Mobile UI/UX",
    description:
      "Create a modern mobile UI/UX concept for a student marketplace, including onboarding and project flows.",
    budget: "$600",
    deadline: "Sep 15, 2026",
    rating: 5.0,
    skills: ["Figma", "UI/UX", "Prototyping", "Design System"],
  },
];

export const freelancers = [
  {
    id: "1",
    name: "Selam M.",
    university: "Addis Tech University",
    rating: 4.9,
    completedProjects: 21,
    skills: ["React", "UI/UX", "Tailwind CSS"],
    // eslint-disable-next-line no-undef
    image: selamAvatar,
    initials: "SM",
    gradient: "from-primary to-secondary",
  },
  {
    id: "2",
    name: "Daniel T.",
    university: "Adama Science University",
    rating: 4.8,
    completedProjects: 17,
    skills: ["Node.js", "MongoDB", "REST API"],
    // eslint-disable-next-line no-undef
    image: danielAvatar,
    initials: "DT",
    gradient: "from-secondary to-accent",
  },
  {
    id: "3",
    name: "Hanna K.",
    university: "Bahir Innovation University",
    rating: 5.0,
    completedProjects: 12,
    skills: ["Data Analysis", "Figma", "Dashboards"],
    // eslint-disable-next-line no-undef
    image: hannaAvatar,
    initials: "HK",
    gradient: "from-accent to-primary",
  },
];

export const testimonials = [
  {
    quote:
      "I landed my first paid project within two weeks. The university verification badge made clients trust my profile immediately.",
    name: "Meron A.",
    role: "Computer Science Student",
    initials: "MA",
  },
  {
    quote:
      "We hired two students for our internal dashboard project. The milestone escrow system made the process safe and professional.",
    name: "Yohannes B.",
    role: "Startup Founder",
    initials: "YB",
  },
  {
    quote:
      "This platform gives our university real visibility into how students apply academic skills in the labor market.",
    name: "Dr. Sara N.",
    role: "University Program Coordinator",
    initials: "SN",
  },
  {
    quote:
      "The AI recommendation engine surfaced students whose skills matched our project much better than keyword search.",
    name: "Abel R.",
    role: "Product Manager",
    initials: "AR",
  },
];

export const pricingPlans = [
  {
    name: "Student",
    price: "Free",
    period: "forever",
    description: "For students who want to build experience and income.",
    features: [
      "Verified student profile",
      "Project discovery",
      "Proposal submission",
      "Portfolio builder",
      "Basic AI recommendations",
    ],
    cta: "Start Free",
    popular: false,
  },
  {
    name: "Client",
    price: "Pay per milestone",
    period: "transparent commission",
    description: "For clients hiring verified student talent.",
    features: [
      "Post unlimited projects",
      "AI-matched student suggestions",
      "Escrow milestone payments",
      "Contract workspace",
      "Invoice and payment history",
    ],
    cta: "Post a Project",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "for institutions",
    description:
      "For universities, NGOs, government agencies, and large organizations.",
    features: [
      "University verification panel",
      "Employment analytics",
      "Custom reporting",
      "Priority support",
      "API access roadmap",
    ],
    cta: "Contact Sales",
    popular: false,
  },
];

export const faqs = [
  {
    question: "How are students verified?",
    answer:
      "Students submit their university email, student ID, or enrollment evidence. University staff review the submission and approve or reject it through the university administration panel.",
  },
  {
    question: "How does escrow payment protect both parties?",
    answer:
      "Clients fund milestones before work begins. The platform holds the funds securely until the client approves the delivered work. Once approved, the amount is released to the student wallet minus platform commission.",
  },
  {
    question: "What types of projects can be posted?",
    answer:
      "Clients can post digital, skill-based projects such as web development, mobile design, data analysis, writing, translation, research assistance, UI/UX design, and multimedia production.",
  },
  {
    question: "How does AI matching work?",
    answer:
      "The AI recommendation module analyzes structured skills, project requirements, portfolio content, and historical patterns to recommend suitable students to clients and suitable projects to students.",
  },
  {
    question: "What is the role of universities?",
    answer:
      "Universities verify student identity, certify selected skills, and access anonymized analytics about student employment outcomes and market-demand skills.",
  },
];

export const footerLinks = [
  {
    title: "Platform",
    links: [
      "Explore Projects",
      "Find Talent",
      "Universities",
      "Pricing",
      "AI Matching",
    ],
  },
  {
    title: "Resources",
    links: [
      "Documentation",
      "Help Center",
      "API Reference",
      "Community",
      "Blog",
    ],
  },
  {
    title: "Company",
    links: ["About Us", "Careers", "Partners", "Contact", "Press Kit"],
  },
  {
    title: "Legal",
    links: [
      "Privacy Policy",
      "Terms of Service",
      "Cookie Policy",
      "Security",
      "Compliance",
    ],
  },
];
