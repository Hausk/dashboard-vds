// /app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email et mot de passe requis");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          throw new Error("Utilisateur non trouvé");
        }

        const passwordMatch = await bcrypt.compare(
          credentials.password,
          user.password,
        );

        if (!passwordMatch) {
          throw new Error("Mot de passe incorrect");
        }

        return {
          id: user.id,
          email: user.email,
          is2FAEnabled: user.is2FAEnabled,
          is2FAVerified: user.is2FAVerified,
          twoFAMethod: user.twoFAMethod,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token }) {
      if (!token.id) {
        const user = await prisma.user.findUnique({
          where: { email: token.email },
        });

        if (user) {
          token.id = user.id;
          token.is2FAEnabled = user.is2FAEnabled;
          token.is2FAVerified = user.is2FAVerified;
          token.twoFAMethod = user.twoFAMethod;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.is2FAEnabled = token.is2FAEnabled;
        session.user.is2FAVerified = token.is2FAVerified;
        session.user.twoFAMethod = token.twoFAMethod;
      }

      return session;
    },
    async redirect({ url, baseUrl, token }) {
      // Gestion des redirections post-authentification
      if (!token) return `${baseUrl}/login`;

      if (token.is2FAEnabled) {
        if (!token.is2FAVerified) {
          return `${baseUrl}/verify-2fa`; // Rediriger vers la page de vérification
        }
      } else {
        return `${baseUrl}/setup-2fa`; // Si l'utilisateur n'a pas activé la 2FA, il doit la configurer
      }

      return `${baseUrl}/`; // Redirection finale vers la page d'accueil
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
