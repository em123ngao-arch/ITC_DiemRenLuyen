const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Clearing imported data...');
  
  // Delete all dependent records for students
  await prisma.evidence.deleteMany();
  await prisma.point.deleteMany();
  await prisma.registration.deleteMany();
  await prisma.activity.deleteMany();
  
  // Delete all students
  const deletedUsers = await prisma.user.deleteMany({
    where: {
      role: 'Sinh viên'
    }
  });
  console.log(`Deleted ${deletedUsers.count} students.`);
  
  // Delete all classes
  const deletedClasses = await prisma.class.deleteMany();
  console.log(`Deleted ${deletedClasses.count} classes.`);
  
  console.log('Data cleared successfully!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
