import { Router, type IRouter } from "express";
import healthRouter from "./health";
import charactersRouter from "./characters";
import templatesRouter from "./templates";
import alertsRouter from "./alerts";
import presetsRouter from "./presets";
import streamRouter from "./stream";

const router: IRouter = Router();

router.use(healthRouter);
router.use(charactersRouter);
router.use(templatesRouter);
router.use(alertsRouter);
router.use(presetsRouter);
router.use(streamRouter);

export default router;
