import { Router } from "express";
import { z } from "zod";

import { prisma } from "./prisma.js";
import { User } from "@prisma/client";

const roleSchema = z.enum(["admin", "editor", "viewer"]);

const listUsersQuerySchema = z.object({
  search: z.string().trim().min(1).optional(),
  role: roleSchema.optional(),
});

const userIdSchema = z.object({
  id: z.string().min(1),
});

export const usersRouter = Router();

usersRouter.get("/", async (req, res) => {
  const parsed = listUsersQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid query parameters" });
  }

  const { search, role } = parsed.data;

  const users = await prisma.user.findMany({
    where: {
      ...(role ? { role } : {}),
      ...(search
        ? {
            name: {
              contains: search,
              mode: "insensitive",
            },
          }
        : {}),
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return res.json(
    users.map((u: User) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      active: u.active,
      createdAt: u.createdAt,
    })),
  );
});

usersRouter.get("/:id", async (req, res) => {
  const parsed = userIdSchema.safeParse(req.params);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid user id" });
  }

  const user = await prisma.user.findUnique({
    where: { id: parsed.data.id },
  });

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  return res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    active: user.active,
    createdAt: user.createdAt,
  });
});

usersRouter.patch("/:id/toggle-active", async (req, res) => {
  const parsed = userIdSchema.safeParse(req.params);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid user id" });
  }

  const existing = await prisma.user.findUnique({
    where: { id: parsed.data.id },
    select: { active: true },
  });
  if (!existing) {
    return res.status(404).json({ message: "User not found" });
  }

  const updated = await prisma.user.update({
    where: { id: parsed.data.id },
    data: { active: !existing.active },
  });
  return res.json({
    id: updated.id,
    name: updated.name,
    email: updated.email,
    role: updated.role,
    active: updated.active,
    createdAt: updated.createdAt,
  });
});
