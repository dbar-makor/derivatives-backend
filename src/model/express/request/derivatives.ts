import { IAuthenticatedRequest } from "./auth";
import express from "express";

interface IaddDerivativesRequest extends IAuthenticatedRequest {
  readonly body: Readonly<{
    file: string;
    date: string;
    floorBroker: string;
  }>;
}

interface IGetDerivativesRequest extends express.Request {}

interface IGetDerivativeRequest extends express.Request {}

interface IDownloadFilesRequest extends express.Request {
  readonly params: Readonly<{ fileId: string }>;
}

interface IGetFloorBrokersRequest extends express.Request {}

export {
  IaddDerivativesRequest,
  IGetDerivativesRequest,
  IGetDerivativeRequest,
  IDownloadFilesRequest,
  IGetFloorBrokersRequest,
};
