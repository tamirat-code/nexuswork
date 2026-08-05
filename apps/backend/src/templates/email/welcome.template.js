export function welcomeEmail({ name }) {
  return {
    subject: "Welcome to NexusWork",
    text: `Hi ${name}, welcome to NexusWork — the student freelance marketplace.`,
  };
}
