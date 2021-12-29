import express from "express";

import { IServerResponse } from "../../shared/response";

type IAddDerivativesResponse = express.Response<IServerResponse>;

type IGetDerivativesResponse = express.Response<
  IServerResponse & {
    data?: {
      username: string;
      date: string;
      id: number;
      wex: string;
      drv: string;
      matched: number;
      unmatched: number;
      complete: number;
      unresolved: string;
    }[];
  }
>;

type IGetDerivativeResponse = express.Response<
  IServerResponse & {
    data?: {
      username: string;
      wex: string;
      drv: string;
      matched: number;
      unmatched: number;
      complete: number;
      unresolved: string;
    };
  }
>;

export {
  IAddDerivativesResponse,
  IGetDerivativesResponse,
  IGetDerivativeResponse,
};
