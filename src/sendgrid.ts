// src/sendgrid.ts (optional, if using a custom Worker)
export default {
  async fetch(request: Request, env: Env) {
    const { to, from, subject, text } = await request.json();
    // Call SendGrid API with env.SENDGRID_API_KEY
    return new Response('Email sent');
  },
};