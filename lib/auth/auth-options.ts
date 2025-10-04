import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { getUser, createUser } from "@/lib/firebase/firestore";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (!user.email) return false;

      // Check if user exists in Firestore
      const existingUser = await getUser(user.id);

      if (!existingUser) {
        // Create new user with default role
        await createUser(user.id, user.email, "user");
      }

      return true;
    },
    async jwt({ token, user, trigger, session }) {
      // Initial sign in
      if (user) {
        const userData = await getUser(user.id);
        token.uid = user.id;
        token.role = userData?.role || "user";
      }

      // Handle session update (e.g., when admin selects location)
      if (trigger === "update" && session?.selectedLocationId) {
        token.selectedLocationId = session.selectedLocationId;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session as any).user.uid = token.uid as string;
        (session as any).user.role = token.role as string;
        (session as any).user.selectedLocationId = token.selectedLocationId as
          | string
          | undefined;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
