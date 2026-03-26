import "dotenv/config";

import { prisma } from "./prisma.js";

async function main() {
  const existing = await prisma.user.count();
  if (existing > 0) {
    console.log(`Seed skipped (users already exist: ${existing})`);
    return;
  }

  const users = [
    {
      name: "John Doe",
      email: "john@x.com",
      role: "admin" as const,
      active: true,
    },
    {
      name: "Jane Smith",
      email: "jane@x.com",
      role: "viewer" as const,
      active: false,
    },
    {
      name: "Alice Johnson",
      email: "alice@x.com",
      role: "editor" as const,
      active: true,
    },
    {
      name: "Bob Lee",
      email: "bob@x.com",
      role: "viewer" as const,
      active: true,
    },
    {
      name: "Eve Adams",
      email: "eve@x.com",
      role: "admin" as const,
      active: false,
    },
  ];

  for (const user of users) {
    await prisma.user.create({ data: user });
  }

  console.log("Seed completed");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
