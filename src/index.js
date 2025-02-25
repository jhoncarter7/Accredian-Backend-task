
import express from "express"
import dotenv from "dotenv";
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';
const app = express();
const prisma = new PrismaClient();

dotenv.config();
app.use(cors());
app.use(express.json());


// Configure nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});


app.post('/api/referrals', async (req, res) => {
  try {
    const { referrerName, referrerEmail, recipientName, recipientEmail } = req.body;
    
    const referral = await prisma.referral.create({
      data: {
        referrerName,
        referrerEmail,
        recipientName,
        recipientEmail,
        referralCourse
      }
    });

    // Send email to recipient
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: recipientEmail,
      subject: `${referrerName} has referred you!`,
      html: `
        <h1>You've been referred!</h1>
        <p>Hello ${recipientName},</p>
        <p>${referrerName} (${referrerEmail}) has referred you to our platform.</p>
        <p>The course you are referred to is ${referralCourse}.</p>
        <p>We look forward to having you join us!</p>
      `
    };

    await transporter.sendMail(mailOptions);
    
    res.json({ message: 'Referral created successfully and email sent', referral });
  } catch (error) {
    console.error('Error creating referral:', error);
    res.status(500).json({ error: 'Error creating referral' });
  }
});

app.get('/api/referrals/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const referrals = await prisma.referral.findMany({
      where: {
        referrerEmail: email
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    res.json(referrals);
  } catch (error) {
    console.error('Error fetching referrals:', error);
    res.status(500).json({ error: 'Error fetching referrals' });
  }
});

// Test route
app.get('/', (req, res) => {
  res.send('Referral system is running!');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Cleanup prisma connection on app termination
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});