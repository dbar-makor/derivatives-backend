import { IAuthenticatedRequest } from "./auth";
import express from "express";

interface IAddDerivativesRequest extends IAuthenticatedRequest {
  readonly body: Readonly<{
    file: string;
    name: string;
    date: string;
    floorBrokerID: number;
  }>;
}

interface IGetDerivativesRequest extends express.Request {}

interface IGetDerivativeRequest extends express.Request {}

interface IDownloadFilesRequest extends express.Request {
  readonly params: Readonly<{ fileId: string }>;
}

export {
  IAddDerivativesRequest,
  IGetDerivativesRequest,
  IGetDerivativeRequest,
  IDownloadFilesRequest,
};
