'use server';

import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { agents } from '@/lib/db/schema';

export async function updateAgentConfig({
  configuration,
  isActive,
  agentId,
}: {
  configuration: string;
  isActive: boolean;
  agentId: string;
}) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return { success: false, message: 'Unauthorized' };
    }

    if (!agentId || configuration === undefined || isActive === undefined) {
      return { success: false, message: 'Missing fields required' };
    }

    await db
      .update(agents)
      .set({
        configuration,
        isActive,
        updatedAt: new Date(),
      })
      .where(eq(agents.id, agentId));

    return { success: true };
  } catch (error) {
    console.error('Failed to update agent:', error);
    return {
      success: false,
      message: 'Failed to update agent configuration',
    };
  }
}
