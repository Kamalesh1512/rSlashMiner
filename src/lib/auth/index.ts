import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import GithubProvider from "next-auth/providers/github";
import { compare } from "bcrypt";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { users } from "@/lib/db/schema";
import { CustomAdapterUser, DrizzleAdapter } from "@/lib/auth/drizzle-adapter";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: DrizzleAdapter(), // Pass database instance
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          const error = new Error("Email and password required");
          error.message ='Email and password required'
          return null
        }

        const user = await db.select().from(users).where(eq(users.email, credentials.email as string));

        if (!user.length || !user[0].password) {
          const error = new Error("No user found with this email");
          error.message='No user found with this email'
          return null;
        }

        const isPasswordValid = await compare(credentials.password as string, user[0].password);

        if (!isPasswordValid) {
          const error = new Error("Incorrect password");
          error.message='Incorrect password'
          return null
        }

        return user[0];
      },
    }),
    // GoogleProvider({
    //   clientId: process.env.GOOGLE_CLIENT_ID!,
    //   clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    // }),
    // GithubProvider({
    //   clientId: process.env.GITHUB_ID!,
    //   clientSecret: process.env.GITHUB_SECRET!,
    // }),
  ],
  trustHost:true,
  pages: {
    signIn: "/login",
    signOut: "/",
    error: "/login",
    newUser: "/agents",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.subscriptionTier = user.subscriptionTier || null;
        token.subscriptionExpiresAt = user.subscriptionExpiresAt || null;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.subscriptionTier = token.subscriptionTier as string | null;
        session.user.subscriptionExpiresAt = token.subscriptionExpiresAt as Date | null;
      }
      return session;
    },
  },
  debug:false,
  secret: process.env.NEXTAUTH_SECRET,
});