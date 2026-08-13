const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 5;
const requests = new Map();

function clean(value, max = 2000) {
  return String(value || "").trim().replace(/[<>]/g, "").slice(0, max);
}

function limited(ip) {
  const now = Date.now();
  const recent = (requests.get(ip) || []).filter((time) => now - time < WINDOW_MS);
  recent.push(now);
  requests.set(ip, recent);
  return recent.length > MAX_REQUESTS;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed." });

  const ip = req.headers["x-forwarded-for"]?.split(",")[0] || "unknown";
  if (limited(ip)) return res.status(429).json({ error: "Too many requests. Please try again later." });

  const { name, email, project, message, website } = req.body || {};
  if (website) return res.status(200).json({ ok: true });

  const safeName = clean(name, 100);
  const safeEmail = clean(email, 160);
  const safeProject = clean(project, 100);
  const safeMessage = clean(message, 3000);
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(safeEmail);
  if (!safeName || !validEmail || safeMessage.length < 10) {
    return res.status(400).json({ error: "Please provide a name, valid email, and project details." });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return res.status(503).json({ error: "Email delivery is being configured. Please use WhatsApp or email for now." });

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.CONTACT_FROM_EMAIL || "Portfolio <onboarding@resend.dev>",
      to: [process.env.CONTACT_TO_EMAIL || "noblemanunachukwu@gmail.com"],
      reply_to: safeEmail,
      subject: `Portfolio inquiry: ${safeProject || "New project"}`,
      text: `Name: ${safeName}\nEmail: ${safeEmail}\nProject: ${safeProject}\n\n${safeMessage}`
    })
  });

  if (!response.ok) return res.status(502).json({ error: "Your message could not be delivered. Please contact me by email or WhatsApp." });
  return res.status(200).json({ ok: true });
}
