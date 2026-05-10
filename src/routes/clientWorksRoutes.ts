import express from "express";
import { getClientWorks } from "../controller/clientWorksController";

const router = express.Router();

router.get("/", getClientWorks);

export default router;
