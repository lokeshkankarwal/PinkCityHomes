import { Router } from "express";
import * as c from "./admin.controller.js";
import { requireAuth, requireRole } from "../../middleware/auth.js";

export const adminRouter = Router();
adminRouter.use(requireAuth, requireRole("SUPERADMIN"));

// Dashboard & Metrics
adminRouter.get("/dashboard", c.dashboard);

// Seller Management
adminRouter.get("/sellers/requests", c.sellerRequests);
adminRouter.get("/seller-requests", c.sellerRequests); // alias
adminRouter.get("/sellers", c.sellers);
adminRouter.get("/sellers/:id", c.getSellerDetails);
adminRouter.post("/sellers/:id/review", c.reviewSeller);
adminRouter.post("/sellers/:id/approve", c.approveSeller);
adminRouter.post("/sellers/:id/reject", c.rejectSeller);
adminRouter.patch("/sellers/:id/disable", c.disableSeller);
adminRouter.patch("/sellers/:id/enable", c.enableSeller);
adminRouter.delete("/sellers/:id", c.deleteSeller);

// User Management
adminRouter.get("/users", c.users);
adminRouter.patch("/users/:id/disable", c.disableUser);
adminRouter.patch("/users/:id/enable", c.enableUser);

// Property Management
adminRouter.get("/properties", c.properties);
adminRouter.patch("/properties/:id/disable", c.disableProperty);
adminRouter.patch("/properties/:id/enable", c.enableProperty);
adminRouter.delete("/properties/:id", c.deleteProperty);
adminRouter.post("/properties/:id/sold", c.markSold);

// Disabled Items Directory
adminRouter.get("/disabled", c.getDisabledItems);

// Audit Logging
adminRouter.get("/audit-logs", c.auditLogs);
