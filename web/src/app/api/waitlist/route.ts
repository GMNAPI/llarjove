import { Resend } from 'resend';
import { NextRequest, NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);

// With Resend test email (onboarding@resend.dev), emails can only be sent to
// your own verified account email. Set WAITLIST_FROM_EMAIL once you have a
// verified domain to also send confirmation emails to users.
const FROM_EMAIL = process.env.WAITLIST_FROM_EMAIL ?? 'onboarding@resend.dev';
const NOTIFY_EMAIL = process.env.WAITLIST_NOTIFY_EMAIL ?? '';

interface WaitlistBody {
  email: string;
  location: string;
  profile: string;
}

export async function POST(req: NextRequest) {
  let body: WaitlistBody;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { email, location, profile } = body;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Email inválido' }, { status: 400 });
  }

  try {
    if (!NOTIFY_EMAIL) {
      console.warn('[waitlist] WAITLIST_NOTIFY_EMAIL not set — signup not notified');
    } else {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: NOTIFY_EMAIL,
        subject: `[LlarJove] Nova inscripció: ${email}`,
        html: `
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Localització:</strong> ${location}</p>
          <p><strong>Perfil:</strong> ${profile}</p>
        `,
      });
    }

    // Welcome email to user — requires a verified domain in Resend.
    // Fails silently so the signup still succeeds during test mode.
    resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'T\'has apuntat a LlarJove ✓',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;color:#1a1a1a;">
          <h2 style="color:#0f766e;">Gràcies per apuntar-te!</h2>
          <p>Hem rebut la teva sol·licitud per unir-te a la beta de <strong>LlarJove</strong>.</p>
          <p>T'avisarem quan obrim l'accés. Mentrestant, pots provar el nostre assistent:</p>
          <p>
            <a href="https://llarjove-production.up.railway.app/chat"
               style="background:#0f766e;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;display:inline-block;">
              Provar el chat
            </a>
          </p>
          <p style="color:#6b7280;font-size:13px;">
            Pots donar-te de baixa en qualsevol moment responent a aquest correu.
          </p>
        </div>
      `,
    }).catch((err) => console.warn('[waitlist] Welcome email failed (domain not verified?):', err));

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[waitlist] Resend error:', err);
    return NextResponse.json({ error: 'Error al enviar el email' }, { status: 500 });
  }
}
