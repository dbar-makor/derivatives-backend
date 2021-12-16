import express from "express";

import { auth } from "../middleware/auth";

import {
  addDerivatives,
  getDerivatives,
  getDerivativeFiles,
} from "../controller/derivatives";

const router = express.Router();

router.post("/", auth, addDerivatives);

router.get("/", auth, getDerivatives);

router.get("/download/:fileId", getDerivativeFiles);

export default router;
