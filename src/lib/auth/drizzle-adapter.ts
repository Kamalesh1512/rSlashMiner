import { and, eq } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import type {
  Adapter,
  AdapterAccount,
  AdapterSession,
  AdapterUser,
} from "next-auth/adapters";
import { db } from "@/lib/db";
import { accounts, sessions, users, verificationTokens } from "@/lib/db/schema";


export interface CustomAdapterUser extends AdapterUser {
  subscriptionTier: string | null;
  subscriptionExpiresAt : Date
}



export function DrizzleAdapter(): Adapter {

  return {
    async createUser(userData) {

      const id = createId();
      await db.insert(users).values({
        id,
        name: userData.name,
        email: userData.email,
        emailVerified: userData.emailVerified,
        image: userData.image,
        subscriptionTier:userData.subscriptionTier as string,
        subscriptionExpiresAt:userData.subscriptionExpiresAt
      });

      const newUser = await db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);

      return (newUser[0] as CustomAdapterUser) || null;
    },

    async getUser(id) {
      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);

      return (user[0] as CustomAdapterUser) || null;
    },

    async getUserByEmail(email) {
      const user = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      return (user[0] as CustomAdapterUser) || null;
    },

    async getUserByAccount({ provider, providerAccountId }) {
      const result = await db
        .select({
          user: users,
        })
        .from(accounts)
        .where(
          and(
            eq(accounts.provider, provider),
            eq(accounts.providerAccountId, providerAccountId)
          )
        )
        .innerJoin(users, eq(accounts.userId, users.id))
        .limit(1); // Ensures only one result is returned

      return result.length ? (result[0].user as CustomAdapterUser) : null;
    },

    async updateUser(user) {
      await db
        .update(users)
        .set({
          name: user.name,
          email: user.email,
          emailVerified: user.emailVerified,
          image: user.image,
        })
        .where(eq(users.id, user.id));

      const updatedUser = await db
        .select()
        .from(users)
        .where(eq(users.id, user.id))
        .limit(1);

      return (updatedUser[0] as CustomAdapterUser) || null;
    },

    async deleteUser(userId) {
      await db.delete(users).where(eq(users.id, userId));
    },

    async linkAccount(accountData) {
      const id = createId();
      await db.insert(accounts).values({
        id,
        userId: accountData.userId,
        type: accountData.type,
        provider: accountData.provider,
        providerAccountId: accountData.providerAccountId,
        expires_at: accountData?.expires_at
          ? Math.floor(accountData.expires_at)
          : null,
      });
    },

    async unlinkAccount({ provider, providerAccountId }) {
      await db
        .delete(accounts)
        .where(
          and(
            eq(accounts.provider, provider),
            eq(accounts.providerAccountId, providerAccountId)
          )
        );
    },

    async createSession(sessionData) {
      await db.insert(sessions).values({
        id: createId(),
        userId: sessionData.userId,
        sessionToken: sessionData.sessionToken,
        expires: sessionData.expires,
      });

      const session = await db
        .select()
        .from(sessions)
        .where(eq(sessions.sessionToken, sessionData.sessionToken))
        .limit(1);

      return session[0] || null;
    },

    async getSessionAndUser(sessionToken) {
      const result = await db
        .select({
          session: {
            id: sessions.id,
            userId: sessions.userId,
            sessionToken: sessions.sessionToken,
            expires: sessions.expires,
          },
          user: {
            id: users.id,
            name: users.name,
            email: users.email,
            emailVerified: users.emailVerified,
            image: users.image,
            subscriptionTier: users.subscriptionTier,
            subscriptionExpiresAt: users.subscriptionExpiresAt,
          },
        })
        .from(sessions)
        .where(eq(sessions.sessionToken, sessionToken))
        .innerJoin(users, eq(sessions.userId, users.id))
        .limit(1); // Ensure correct join condition

      if (!result) return null;

      return {
        session: result[0].session as AdapterSession,
        user: result[0].user as CustomAdapterUser,
      };
    },

    async updateSession(session) {
      await db
        .update(sessions)
        .set({
          expires: session.expires,
        })
        .where(eq(sessions.sessionToken, session.sessionToken));

      const updatedSession = await db
        .select()
        .from(sessions)
        .where(eq(sessions.sessionToken, session.sessionToken));

      return updatedSession[0] as AdapterSession;
    },

    async deleteSession(sessionToken) {
      await db.delete(sessions).where(eq(sessions.sessionToken, sessionToken));
    },

    async createVerificationToken(verificationToken) {
      await db.insert(verificationTokens).values({
        identifier: verificationToken.identifier,
        token: verificationToken.token,
        expires: verificationToken.expires,
      });

      return verificationToken;
    },

    async useVerificationToken({ identifier, token }) {
      const verificationToken = await db.select().from(verificationTokens).where(and(
          eq(verificationTokens.identifier, identifier),
          eq(verificationTokens.token, token)
        ))

      if (!verificationToken) return null;

      await db
        .delete(verificationTokens)
        .where(
          and(
            eq(verificationTokens.identifier, identifier),
            eq(verificationTokens.token, token)
          )
        );

      return {
        identifier: verificationToken[0].identifier,
        token: verificationToken[0].token,
        expires: verificationToken[0].expires,
      };
    },
  };
}
