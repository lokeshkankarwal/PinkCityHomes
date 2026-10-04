import { Router } from "express";
import * as c from "./projects.controller.js";
import { requireAuth, requireRole } from "../../middleware/auth.js";

export const projectsRouter = Router();

projectsRouter.get("/", c.listPublic);
projectsRouter.get("/mine", requireAuth, requireRole("SELLER", "SUPERADMIN"), c.listMine);
projectsRouter.post("/", requireAuth, requireRole("SELLER", "SUPERADMIN"), c.createMine);
projectsRouter.get("/:id", c.getPublic);
