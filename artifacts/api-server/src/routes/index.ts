import { Router, type IRouter } from "express";
import aiImagesRouter from "./ai-images";
import healthRouter from "./health";
import charactersRouter from "./characters";
import templatesRouter from "./templates";
import alertsRouter from "./alerts";
import presetsRouter from "./presets";
import streamRouter from "./stream";
import recordingsRouter from "./recordings";
import aiImagesRouter from "./ai-images";

const router: IRouter = Router();

router.use(healthRouter);
router.use(charactersRouter);
router.use(templatesRouter);
router.use(alertsRouter);
router.use(presetsRouter);
router.use(streamRouter);
router.use(recordingsRouter);

router.use("/ai-images", aiImagesRouter);

export default router;
