import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import settingsRouter from "./settings";
import dashboardRouter from "./dashboard";
import serversRouter from "./servers";
import nodesRouter from "./nodes";
import usersRouter from "./users";
import activityRouter from "./activity";
import eggsRouter from "./eggs";
import userServersRouter from "./user-servers";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(settingsRouter);
router.use(dashboardRouter);
router.use(serversRouter);
router.use(nodesRouter);
router.use(usersRouter);
router.use(activityRouter);
router.use(eggsRouter);
router.use(userServersRouter);

export default router;
