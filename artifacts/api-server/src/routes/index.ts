import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import activityRouter from "./activity";
import usersRouter from "./users";
import sessionsRouter from "./sessions";
import reportsRouter from "./reports";
import adminRouter from "./admin";

const router: IRouter = Router();
router.use(healthRouter);
router.use(authRouter);
router.use(activityRouter);
router.use(usersRouter);
router.use(sessionsRouter);
router.use(reportsRouter);
router.use(adminRouter);

export default router;
