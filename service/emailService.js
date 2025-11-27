import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function enviarEmailRecuperacao(email, token) {
  const link = `http://localhost:5173/recuperar/${token}`;

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Recuperação de senha",
    html: `
      <h2>Redefinir senha</h2>
      <p>Clique abaixo para criar uma nova senha:</p>
      <a href="${link}">${link}</a>
    `,
  });
}