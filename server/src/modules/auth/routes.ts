import { Router } from "express";
import multer from "multer";
import * as c from "./auth.controller.js";
import { requireAuth } from "../../middleware/auth.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

export const authRouter = Router();

authRouter.post("/register", c.register);
authRouter.post("/verify-email", c.verifyEmail);
authRouter.post("/verify", c.verifyEmail);
authRouter.post("/resend-otp", c.resendOtp);
authRouter.post("/login", c.login);
authRouter.post("/logout", c.logout);
authRouter.get("/me", requireAuth, c.me);
authRouter.patch("/me", requireAuth, c.updateProfile);
authRouter.patch("/profile", requireAuth, c.updateProfile);
authRouter.post("/profile/avatar", requireAuth, upload.single("avatar"), c.uploadAvatar);
