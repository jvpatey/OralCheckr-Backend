import { Request, Response } from "express";
import { Resend } from "resend";
import { ContactFormData } from "../interfaces/contact";

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Send contact form email via Resend
 * POST /api/contact
 */
export const sendContactEmail = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { name, email, subject, message }: ContactFormData = req.body;

    // Validation
    if (!name || !email || !subject || !message) {
      res.status(400).json({
        message: "All fields are required",
      });
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({
        message: "Invalid email address",
      });
      return;
    }

    // Message length validation
    if (message.length < 10) {
      res.status(400).json({
        message: "Message must be at least 10 characters",
      });
      return;
    }

    // Check if RESEND_API_KEY is configured
    if (!process.env.RESEND_API_KEY) {
      console.error("RESEND_API_KEY is not configured");
      res.status(500).json({
        message: "Email service is not configured",
      });
      return;
    }

    // Check if CONTACT_EMAIL is configured
    if (!process.env.CONTACT_EMAIL) {
      console.error("CONTACT_EMAIL is not configured");
      res.status(500).json({
        message: "Contact email is not configured",
      });
      return;
    }

    // Send email using Resend
    const result = await resend.emails.send({
      from: "OralCheckr Contact <onboarding@resend.dev>", // Change this after domain verification
      to: [process.env.CONTACT_EMAIL],
      replyTo: email,
      subject: `Contact Form: ${subject}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>From:</strong> ${name} (${email})</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <hr />
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, "<br>")}</p>
        <hr />
        <p style="color: #666; font-size: 12px;">
          Reply to this email to respond directly to ${name}
        </p>
      `,
    });

    console.log("Email sent successfully:", result);

    res.status(200).json({
      message: "Email sent successfully",
      id: result.data?.id,
    });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({
      message: "Failed to send email. Please try again later.",
    });
  }
};
