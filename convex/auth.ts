import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";
import Google from "@auth/core/providers/google";
import Resend from "@auth/core/providers/resend";
import { Resend as ResendAPI } from "resend";

export const { auth, signIn, signOut, store } = convexAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
        };
      },
    }),
    Password({
      id: "password",
      profile(params) {
        return {
          email: params.email as string,
          name: params.name as string,
          phone: params.phone as string,
        };
      },
      verify: Resend({
        id: "resend-otp",
        apiKey: process.env.RESEND_API_KEY,
        async generateVerificationToken() {
          const digits = "0123456789";
          let token = "";
          for (let i = 0; i < 6; i++) {
            token += digits[Math.floor(Math.random() * 10)];
          }
          return token;
        },
        async sendVerificationRequest({ identifier: email, provider, token }) {
          const resend = new ResendAPI(provider.apiKey);
          const { error } = await resend.emails.send({
            from: "Beembai <auth@resend.lawjun.ng>",
            to: [email],
            subject: `Verify your email for beembai`,
            text: `Your verification code is ${token}`,
          });
          if (error) {
            throw new Error(
              `Could not send verification email: ${JSON.stringify(error)}`,
            );
          }
        },
      }),
    }),
  ],
});
