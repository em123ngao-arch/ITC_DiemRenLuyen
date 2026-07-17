const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  console.log('Users:', users);
  
  const classes = await prisma.class.findMany();
  console.log('Classes:', classes);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
