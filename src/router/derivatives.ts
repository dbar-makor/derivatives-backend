import express from "express";
import multer from "multer";
const upload = multer({ dest: "hey/" });

import { auth } from "../middleware/auth";

import {
  addDerivatives,
  getDerivatives,
  getDerivativeFiles,
  getDerivative,
} from "../controller/derivatives";

const router = express.Router();

router.post("/", auth, upload.single("csv"), addDerivatives);

router.get("/", auth, getDerivatives);

router.get("/single", auth, getDerivative);

router.get("/download/:fileId", auth, getDerivativeFiles);

export default router;
