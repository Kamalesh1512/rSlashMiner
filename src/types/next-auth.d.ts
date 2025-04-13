// // next-auth.d.ts
// import NextAuth, { DefaultSession, DefaultUser } from "next-auth";

// declare module "next-auth" {
//   interface Session {
//     user: {
//       id: string;
//     } & DefaultSession["user"];
//   }

//   interface User extends DefaultUser {
//     id: string;
//   }
// }


// next-auth.d.ts
import NextAuth, { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      subscriptionTier?: string | null;
      subscriptionExpiresAt?: Date | null;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    id: string;
    subscriptionTier?: string | null;
    subscriptionExpiresAt?: Date | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    subscriptionTier?: string | null;
    subscriptionExpiresAt?: Date | null;
  }
}
