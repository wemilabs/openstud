import type { UserRole } from '@/lib/generated/prisma/client';
import type { DefaultSession } from 'next-auth';
import 'next-auth/jwt';

// Extend the built-in session types
declare module 'next-auth' {
	interface Session {
		user: {
			role?: UserRole;
		} & DefaultSession['user'];
		onboardingCompleted?: boolean;
	}
}

// Extend the built-in JWT type
declare module 'next-auth/jwt' {
	interface JWT {
		role?: UserRole;
		onboardingCompleted?: boolean;
	}
}
