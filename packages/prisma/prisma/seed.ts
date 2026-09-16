import { PrismaClient, UserRole, UserStatus, InternshipStatus, WorkflowStatus, TaskStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting InternOS database seed (Phase 0)...');

  const passwordHash = await bcrypt.hash('Password123!', 10);

  // 1. Create Organization (Tenant Root)
  const org = await prisma.organization.upsert({
    where: { code: 'apex-inst' },
    update: {},
    create: {
      code: 'apex-inst',
      name: 'Apex Institute of Technology',
      domain: 'apex.edu',
      settings: {
        academicYear: '2026-2027',
        allowExternalMentors: true,
        requireRubricEvaluation: true,
      },
    },
  });

  console.log(`✅ Organization created: ${org.name} (${org.code})`);

  // 2. Create Departments
  const deptCse = await prisma.department.upsert({
    where: {
      organizationId_code: {
        organizationId: org.id,
        code: 'CSE',
      },
    },
    update: {},
    create: {
      organizationId: org.id,
      code: 'CSE',
      name: 'Department of Computer Science & Engineering',
    },
  });

  const deptEce = await prisma.department.upsert({
    where: {
      organizationId_code: {
        organizationId: org.id,
        code: 'ECE',
      },
    },
    update: {},
    create: {
      organizationId: org.id,
      code: 'ECE',
      name: 'Department of Electronics & Communication Engineering',
    },
  });

  console.log('✅ Departments created: CSE, ECE');

  // 3. Create Demo Users for each role
  // Super Admin
  const superAdmin = await prisma.user.upsert({
    where: {
      organizationId_email: {
        organizationId: org.id,
        email: 'superadmin@internos.local',
      },
    },
    update: {},
    create: {
      organizationId: org.id,
      email: 'superadmin@internos.local',
      passwordHash,
      firstName: 'Global',
      lastName: 'Admin',
      role: UserRole.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
    },
  });

  // Institution Admin
  const instAdmin = await prisma.user.upsert({
    where: {
      organizationId_email: {
        organizationId: org.id,
        email: 'admin@apex.edu',
      },
    },
    update: {},
    create: {
      organizationId: org.id,
      email: 'admin@apex.edu',
      passwordHash,
      firstName: 'Dr. Arthur',
      lastName: 'Pendelton',
      role: UserRole.INSTITUTION_ADMIN,
      status: UserStatus.ACTIVE,
    },
  });

  // Faculty Supervisor
  const facultyUser = await prisma.user.upsert({
    where: {
      organizationId_email: {
        organizationId: org.id,
        email: 'dr.sharma@apex.edu',
      },
    },
    update: {},
    create: {
      organizationId: org.id,
      departmentId: deptCse.id,
      email: 'dr.sharma@apex.edu',
      passwordHash,
      firstName: 'Priya',
      lastName: 'Sharma',
      role: UserRole.FACULTY_SUPERVISOR,
      status: UserStatus.ACTIVE,
    },
  });

  const facultyProfile = await prisma.facultyProfile.upsert({
    where: { userId: facultyUser.id },
    update: {},
    create: {
      userId: facultyUser.id,
      departmentId: deptCse.id,
      designation: 'Associate Professor & Internship Coordinator',
      employeeId: 'FAC-CSE-042',
    },
  });

  // Company
  const company = await prisma.company.upsert({
    where: { id: 'acme-cloud-labs-uuid' },
    update: {},
    create: {
      id: 'acme-cloud-labs-uuid',
      organizationId: org.id,
      name: 'Acme Cloud Labs',
      industry: 'Cloud Infrastructure & AI Systems',
      website: 'https://acmecloud.example.com',
      isVerified: true,
    },
  });

  // Industry Mentor
  const mentorUser = await prisma.user.upsert({
    where: {
      organizationId_email: {
        organizationId: org.id,
        email: 'raj.patel@acmecloud.com',
      },
    },
    update: {},
    create: {
      organizationId: org.id,
      email: 'raj.patel@acmecloud.com',
      passwordHash,
      firstName: 'Rajesh',
      lastName: 'Patel',
      role: UserRole.INDUSTRY_MENTOR,
      status: UserStatus.ACTIVE,
    },
  });

  const mentorProfile = await prisma.mentorProfile.upsert({
    where: { userId: mentorUser.id },
    update: {},
    create: {
      userId: mentorUser.id,
      companyId: company.id,
      designation: 'Staff Infrastructure Architect',
    },
  });

  // Student User
  const studentUser = await prisma.user.upsert({
    where: {
      organizationId_email: {
        organizationId: org.id,
        email: 'alex.student@apex.edu',
      },
    },
    update: {},
    create: {
      organizationId: org.id,
      departmentId: deptCse.id,
      email: 'alex.student@apex.edu',
      passwordHash,
      firstName: 'Alex',
      lastName: 'Morgan',
      role: UserRole.STUDENT,
      status: UserStatus.ACTIVE,
    },
  });

  const studentProfile = await prisma.studentProfile.upsert({
    where: { userId: studentUser.id },
    update: {},
    create: {
      userId: studentUser.id,
      departmentId: deptCse.id,
      rollNumber: '2023-CS-108',
      batchYear: 2026,
      cgpa: 3.85,
    },
  });

  console.log('✅ Demo users seeded across all 5 roles (Default password: Password123!)');

  // 4. Create Workflow Template
  const workflowTemplate = await prisma.workflowTemplate.create({
    data: {
      organizationId: org.id,
      name: 'Standard 16-Week Engineering Internship',
      description: 'Default outcome-based monitoring lifecycle for technical degree programs',
      stepsConfig: [
        { stage: 'ONBOARDING', tasks: ['Offer Letter Verification', 'Mentor Orientation'] },
        { stage: 'MID_TERM', tasks: ['Mid-Term Progress Report', 'Technical Log Review'] },
        { stage: 'FINAL', tasks: ['Final Technical Report', 'Industry Evaluation', 'Viva Voce'] },
      ],
    },
  });

  // 5. Create Sample Internship
  const internship = await prisma.internship.create({
    data: {
      organizationId: org.id,
      studentId: studentProfile.id,
      companyId: company.id,
      facultyId: facultyProfile.id,
      mentorId: mentorProfile.id,
      title: 'Cloud Systems Engineering Intern',
      type: 'FULL_TIME',
      status: InternshipStatus.ACTIVE,
      startDate: new Date('2026-06-01'),
      endDate: new Date('2026-09-30'),
    },
  });

  // 6. Workflow Instance and Initial Task
  const workflowInstance = await prisma.workflowInstance.create({
    data: {
      organizationId: org.id,
      internshipId: internship.id,
      templateId: workflowTemplate.id,
      status: WorkflowStatus.IN_PROGRESS,
      progress: 35,
    },
  });

  await prisma.workflowTask.create({
    data: {
      organizationId: org.id,
      instanceId: workflowInstance.id,
      title: 'Submit Mid-Term Technical Milestone Report',
      stage: 'MID_TERM',
      status: TaskStatus.PENDING,
      dueDate: new Date('2026-07-31'),
      assigneeRole: UserRole.STUDENT,
    },
  });

  // 7. Educational Outcomes (PO Mapping)
  await prisma.outcome.upsert({
    where: {
      organizationId_code: {
        organizationId: org.id,
        code: 'PO-1',
      },
    },
    update: {},
    create: {
      organizationId: org.id,
      code: 'PO-1',
      name: 'Engineering Knowledge Application',
      description: 'Apply knowledge of mathematics, science, and computing fundamentals to solve real-world problems.',
      bloomLevel: 'Applying',
      versions: {
        create: {
          versionNumber: 1,
          rubric: {
            levels: [
              { score: 4, label: 'Exemplary' },
              { score: 3, label: 'Proficient' },
              { score: 2, label: 'Developing' },
              { score: 1, label: 'Unacceptable' },
            ],
          },
        },
      },
    },
  });

  console.log('✅ Workflow templates, internships, and outcomes successfully seeded!');
  console.log('🏁 Seed completed successfully.');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
