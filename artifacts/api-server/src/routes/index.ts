import { Router, type IRouter } from "express";
import healthRouter from "./health";
import analysesRouter from "./analyses";
import doctorsRouter from "./doctors";
import dashboardRouter from "./dashboard";
import chatRouter from "./chat";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/analyses", analysesRouter);
router.use("/doctors", doctorsRouter);
router.use("/dashboard", dashboardRouter);
router.use("/chat", chatRouter);

export default router;
