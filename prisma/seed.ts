/**
 * File Description:
 * Database seed script for baseline teams, users, workflows, stages, tasks, and comments.
 *
 * Purpose:
 * Bootstrap a predictable development dataset for local runs, demos, and tests.
 */

import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { config as loadEnv } from 'dotenv';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { Pool } from 'pg';

const candidateEnvPaths = [resolve(process.cwd(), '.env'), resolve(process.cwd(), '../../.env')];
for (const envPath of candidateEnvPaths) {
  if (existsSync(envPath)) {
    loadEnv({ path: envPath });
    break;
  }
}

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is missing. Ensure .env is present at repo root.');
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

async function main() {
  const rounds = Number(process.env.BCRYPT_SALT_ROUNDS ?? 12);
  const adminHash = await bcrypt.hash('Admin@123456', rounds);
  const userHash = await bcrypt.hash('User@123456', rounds);

  const defaultTeams = [
    { name: 'General', description: 'Default team for backfill and unassigned users' },
    { name: 'Development', description: 'Development team' },
    { name: 'QA', description: 'Quality assurance team' },
    { name: 'Support', description: 'Support team' },
    { name: 'Infrastructure', description: 'Infrastructure team' },
    { name: 'Operations', description: 'Default operations team' }
  ];

  for (const team of defaultTeams) {
    await prisma.team.upsert({
      where: { name: team.name },
      update: {
        description: team.description
      },
      create: {
        name: team.name,
        description: team.description
      }
    });
  }

  const generalTeam = await prisma.team.findUnique({ where: { name: 'General' } });
  const operationsTeam = await prisma.team.findUnique({ where: { name: 'Operations' } });

  if (!generalTeam || !operationsTeam) {
    throw new Error('Required teams missing after upsert');
  }

  const admin = await prisma.user.upsert({
    where: { email: 'admin@task.local' },
    update: {
      teamId: generalTeam.id,
      teamName: generalTeam.name
    },
    create: {
      name: 'System Admin',
      email: 'admin@task.local',
      passwordHash: adminHash,
      role: 'ADMIN',
      teamId: generalTeam.id,
      teamName: generalTeam.name
    }
  });

  const user = await prisma.user.upsert({
    where: { email: 'user@task.local' },
    update: {
      teamId: generalTeam.id,
      teamName: generalTeam.name
    },
    create: {
      name: 'Default User',
      email: 'user@task.local',
      passwordHash: userHash,
      role: 'USER',
      teamId: generalTeam.id,
      teamName: generalTeam.name
    }
  });

  await prisma.user.updateMany({
    where: {
      OR: [{ teamId: null }, { teamName: null }]
    },
    data: {
      teamId: generalTeam.id,
      teamName: generalTeam.name
    }
  });

  const defaultWorkflow = await prisma.workflow.upsert({
    where: { id: 'default-workflow-seed' },
    update: {
      workflowName: 'Default Workflow',
      isDefault: true
    },
    create: {
      id: 'default-workflow-seed',
      workflowName: 'Default Workflow',
      isDefault: true
    }
  });

  const defaultStages = [
    { id: 'seed-stage-todo', stageName: 'Todo', stageOrder: 0, kind: 'TODO' as const },
    { id: 'seed-stage-progress', stageName: 'In Progress', stageOrder: 1, kind: 'IN_PROGRESS' as const },
    { id: 'seed-stage-completed', stageName: 'Completed', stageOrder: 2, kind: 'COMPLETED' as const }
  ];

  for (const stage of defaultStages) {
    await prisma.workflowStage.upsert({
      where: { id: stage.id },
      update: {
        stageName: stage.stageName,
        stageOrder: stage.stageOrder,
        kind: stage.kind,
        workflowId: defaultWorkflow.id
      },
      create: {
        id: stage.id,
        stageName: stage.stageName,
        stageOrder: stage.stageOrder,
        kind: stage.kind,
        workflowId: defaultWorkflow.id
      }
    });
  }

  await prisma.task.createMany({
    data: [
      {
        title: 'Prepare compliance report',
        description: 'Finalize quarterly compliance report',
        status: 'TODO',
        priority: 'HIGH',
        dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2),
        teamId: operationsTeam.id,
        workflowStageId: defaultStages[0].id,
        assignedUserId: user.id,
        createdById: admin.id
      },
      {
        title: 'Team planning',
        description: 'Plan next sprint backlog',
        status: 'IN_PROGRESS',
        priority: 'MEDIUM',
        dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 4),
        teamId: operationsTeam.id,
        workflowStageId: defaultStages[1].id,
        assignedUserId: admin.id,
        createdById: user.id
      }
    ],
    skipDuplicates: true
  });

  const existingTasks = await prisma.task.findMany({ select: { id: true, createdById: true } });
  for (const task of existingTasks) {
    const existingComment = await prisma.taskComment.findFirst({ where: { taskId: task.id } });
    if (!existingComment) {
      await prisma.taskComment.create({
        data: {
          taskId: task.id,
          authorId: task.createdById ?? admin.id,
          content: 'Task created.'
        }
      });
    }
  }
}

async function run() {
  try {
    await main();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

void run();
