import fs from "fs";
import csv from "csv-parser";
import rp from "request-promise";
import moment from "moment";
import converter from "json-2-csv";

import ServerGlobal from "../server-global";

import Derivative from "../model/derivative";
import User from "../model/user";

import { removeCommas } from "../utils/derivatives";
import {
  formatWEXExpiry,
  WEXUniqueDatesArray,
  WEXGroupBy,
  formatWEXDate,
} from "../utils/wex";
import { formatDRVDate, DRVGroupBy } from "../utils/drv";

import {
  IaddDerivativesRequest,
  IGetDerivativesRequest,
  IGetDerivativeRequest,
  IDownloadFilesRequest,
} from "../model/express/request/derivatives";
import {
  IaddDerivativesResponse,
  IGetDerivativesResponse,
  IGetDerivativeResponse,
} from "../model/express/response/derivatives";

import {
  IWEXInterface,
  IDRVInterface,
  IWEXInterfaceObjectOfArrays,
  IDRVInterfaceObjectOfArrays,
} from "../model/shared/derivatives";

const addDerivatives = async (
  req: IaddDerivativesRequest,
  res: IaddDerivativesResponse,
) => {
  const base64WEX = req.body.file;
  const WEX: IWEXInterface[] = [];
  const date = new Date();
  const formattedDate = moment(date).format("DD-MM-YYYY-HH-mm-ss");
  let DRVJSONMakorX: string;
  let canceledInversePairsArrayWEX: IWEXInterface[] = [];
  let WEXArrayFilteredByDRV: IWEXInterface[] = [];
  let WEXGroupedArrayFilteredByDRV: IWEXInterface[] = [];
  let WEXfilterdByGroupedWEX: IWEXInterface[] = [];
  let WEXfilterdByGroupedDRV: IWEXInterface[] = [];
  let WEXArrayGrouped: IWEXInterface[] = [];
  let DRVArrayGrouped: IDRVInterface[] = [];
  let unresolved: IWEXInterface[] = [];

  ServerGlobal.getInstance().logger.info(
    `<addDerivatives>: Start processing request`,
  );

  try {
    const userByID = await User.findByPk(req.user_id);

    if (!userByID) {
      ServerGlobal.getInstance().logger.error(
        `<editProfile>: Failed to get user details for user id ${req.user_id}`,
      );

      res.status(401).send({
        success: false,
        message: "Could not find user",
      });
      return;
    }

    rp(
      `${process.env.MAKOR_X_URL}${process.env.MAKOR_X_API_KEY}&month=8&year=2021`,
    )
      .then((body) => {
        DRVJSONMakorX = body;
        directoryActions();
        return;
      })
      .catch((err) => {
        ServerGlobal.getInstance().logger.error(
          `<addDerivatives>: Failed to get DRV from makor-x because of error: ${err}`,
        );

        res.status(400).send({
          success: false,
          message: `Failed to get DRV from makor-x because of error: ${err}`,
        });
        return;
      });

    // Check if WEX base64WEX is valid
    if (!base64WEX) {
      ServerGlobal.getInstance().logger.error(
        "<addDerivatives>: Failed to process base64WEX",
      );

      res.status(400).send({
        success: false,
        message: "invalid file",
      });
      return;
    }

    const WEXSplited = base64WEX.split(";base64,").pop();

    // Check if WEX base64WEX is valid
    if (!WEXSplited) {
      ServerGlobal.getInstance().logger.error(
        "<addDerivatives>: Failed to process WEXSplited/DRVSplited",
      );

      res.status(400).send({
        success: false,
        message: "invalid file",
      });
      return;
    }

    const directoryActions = async () => {
      fs.writeFileSync(
        `assets/WEX-${userByID.username}-${formattedDate}.csv`,
        WEXSplited,
        {
          encoding: "base64",
        },
      );

      fs.createReadStream(
        `assets/WEX-${userByID.username}-${formattedDate}.csv`,
      )
        .pipe(csv())
        .on("data", async (data: IWEXInterface) => {
          WEX.push(data);
        })
        .on("end", () => {
          derivativesActions();
        });

      ServerGlobal.getInstance().logger.info(
        `<addDerivatives>: Successfully created the files to dir`,
      );
    };

    const derivativesActions = async () => {
      // Parsing JSON from makor-x to array of objects
      const DRV: IDRVInterface[] = JSON.parse(DRVJSONMakorX);
      // const DRV: IDRVInterface[] = [];

      const modifiedDRV = DRV.map((element) => {
        const modifiedDate = formatDRVDate(element.date!);
        const modifiedSide = element.side?.charAt(0).toLowerCase();
        const modifiedQuantity = Number(
          removeCommas(element.quantity?.toString()!),
        );
        const modifiedSymbol = element.symbol?.toLowerCase();
        const modifiedExpiry = formatDRVDate(element.expiry!);
        const modifiedStrike = Number(removeCommas(element.strike));
        const modifiedOption = element.option?.charAt(0).toLowerCase();
        const modifiedPrice = Number(
          Number(removeCommas(element.price?.toString())).toFixed(2),
        );

        return {
          ...element,
          modifiedDate,
          modifiedSide,
          modifiedQuantity,
          modifiedSymbol,
          modifiedExpiry,
          modifiedStrike,
          modifiedOption,
          modifiedPrice,
        };
      });

      const modifiedWEX = WEX.map((element) => {
        const modifiedDate = formatWEXDate(element.Date!);
        const modifiedUser = element.User?.toLowerCase();
        const modifiedSide = element.Side?.charAt(0).toLowerCase();
        const modifiedExecQty = Number(
          removeCommas(element["Exec Qty"]?.toString()!),
        );
        const modifiedSecurity = element.Security?.toLowerCase();
        const modifiedRoot = element.Root?.toLowerCase();
        const modifiedExpiry = formatDRVDate(element.Expiry!);
        const modifiedStrike = Number(
          removeCommas(element.Strike?.toString().replace("$", "")),
        );
        const modifiedCallPut = element["Call/Put"]?.toLowerCase();
        const modifiedAveragePrice = Number(
          Number(
            removeCommas(element["Average Price"]?.replace("$", "")),
          ).toFixed(2),
        );
        const modifiedPortfolio =
          element.Portfolio?.split("-")[0].toLowerCase();
        const modifiedCommissionType =
          element["Commission Type"]?.toLowerCase();
        const modifiedCommissionRate = Number(element["Commission Rate"]);
        const modifiedTotalCharge = Number(
          element["Total Charge"]
            ?.toString()
            .replace("$", "")
            .replace(/[()]/g, ""),
        );

        return {
          ...element,
          modifiedDate,
          modifiedUser,
          modifiedSide,
          modifiedExecQty,
          modifiedSecurity,
          modifiedRoot,
          modifiedExpiry,
          modifiedStrike,
          modifiedCallPut,
          modifiedAveragePrice,
          modifiedPortfolio,
          modifiedCommissionType,
          modifiedCommissionRate,
          modifiedTotalCharge,
        };
      });

      const WEXUniqueDates = WEXUniqueDatesArray(modifiedWEX);

      // Separate WEX result by date
      const WEXArraySeparatedByDates: IWEXInterfaceObjectOfArrays =
        modifiedWEX.reduce((arr, WEX) => {
          arr[WEX.modifiedDate!] = arr[WEX.modifiedDate!] || [];
          arr[WEX.modifiedDate!].push(WEX);
          return arr;
        }, Object.create(null));

      // Separate DRV result by date
      const DRVArraySeparatedByDates: IDRVInterfaceObjectOfArrays =
        modifiedDRV.reduce((arr, DRV) => {
          arr[DRV.modifiedDate!] = arr[DRV.modifiedDate!] || [];
          arr[DRV.modifiedDate!].push(DRV);
          return arr;
        }, Object.create(null));

      // First step - Remove cancelling executions from source
      for (const date of WEXUniqueDates) {
        // Check if date is valid
        if (!date) {
          ServerGlobal.getInstance().logger.error(
            "<addDerivatives>: Failed because date is invalid",
          );

          res.status(400).send({
            success: false,
            message: "date is invalid",
          });
          return;
        }

        // Run over each row in date
        for (let i = 0; i < WEXArraySeparatedByDates[date].length; i++) {
          // Run over each row starting from the outer element's position
          for (let j = i + 1; j < WEXArraySeparatedByDates[date].length; j++) {
            const {
              modifiedUser: user_i,
              modifiedDate: date_i,
              Route: route_i,
              modifiedSide: side_i,
              modifiedSecurity: security_i,
              modifiedRoot: root_i,
              modifiedExpiry: expiry_i,
              modifiedStrike: strike_i,
              modifiedCallPut: callPut_i,
              modifiedAveragePrice: averagePrice_i,
              modifiedTotalCharge: totalCharge_i,
              modifiedPortfolio: portfolio_i,
              modifiedCommissionType: commissionType_i,
              modifiedExecQty: execQty_i,
              removed: removed_i,
            } = WEXArraySeparatedByDates[date][i];
            const {
              modifiedUser: user_j,
              modifiedDate: date_j,
              Route: route_j,
              modifiedSide: side_j,
              modifiedSecurity: security_j,
              modifiedRoot: root_j,
              modifiedExpiry: expiry_j,
              modifiedStrike: strike_j,
              modifiedCallPut: callPut_j,
              modifiedAveragePrice: averagePrice_j,
              modifiedTotalCharge: totalCharge_j,
              modifiedPortfolio: portfolio_j,
              modifiedCommissionType: commissionType_j,
              modifiedExecQty: execQty_j,
              removed: removed_j,
            } = WEXArraySeparatedByDates[date][j];
            if (
              !removed_i &&
              !removed_j &&
              execQty_i === Number(execQty_j) * -1 &&
              totalCharge_i === totalCharge_j &&
              user_i === user_j &&
              date_i === date_j &&
              route_i === route_j &&
              side_i === side_j &&
              security_i === security_j &&
              root_i === root_j &&
              expiry_i === expiry_j &&
              strike_i === strike_j &&
              callPut_i === callPut_j &&
              averagePrice_i === averagePrice_j &&
              commissionType_i === commissionType_j &&
              portfolio_i === portfolio_j
            ) {
              WEXArraySeparatedByDates[date!][i].removed = true;
              WEXArraySeparatedByDates[date!][j].removed = true;
            }
          }
        }

        let canceledInversePairsWEXArraySeparatedByDates: IWEXInterface[] = [];

        canceledInversePairsWEXArraySeparatedByDates = WEXArraySeparatedByDates[
          date
        ].filter((element) => {
          return !element.removed;
        });

        canceledInversePairsArrayWEX = canceledInversePairsArrayWEX.concat(
          canceledInversePairsWEXArraySeparatedByDates,
        );
      }

      // Separate canceled inverse pair WEX result by date
      const canceledInversePairsWEXArraySeparatedByDates: IWEXInterfaceObjectOfArrays =
        canceledInversePairsArrayWEX.reduce((arr, WEX) => {
          arr[WEX.modifiedDate!] = arr[WEX.modifiedDate!] || [];
          arr[WEX.modifiedDate!].push(WEX);
          return arr;
        }, Object.create(null));

      // Second step - 1 execution from source V 1 execution in target
      for (const date of WEXUniqueDates) {
        // Check if date is valid
        if (!date) {
          ServerGlobal.getInstance().logger.error(
            "<addDerivatives>: Failed because date is invalid",
          );

          res.status(400).send({
            success: false,
            message: "date is invalid",
          });
          return;
        }

        const filteredByDRV = canceledInversePairsWEXArraySeparatedByDates[
          date
        ].filter(
          (WEXRow) =>
            !DRVArraySeparatedByDates[date].find(
              ({
                modifiedDate,
                modifiedSide,
                modifiedSymbol,
                modifiedExpiry,
                modifiedStrike,
                modifiedOption,
                modifiedPrice,
                modifiedQuantity,
              }) =>
                WEXRow.modifiedDate === modifiedDate &&
                WEXRow.modifiedSide === modifiedSide &&
                WEXRow.modifiedRoot === modifiedSymbol &&
                WEXRow.modifiedCallPut === modifiedOption &&
                WEXRow.modifiedExecQty === modifiedQuantity &&
                WEXRow.modifiedAveragePrice === modifiedPrice &&
                WEXRow.modifiedStrike === modifiedStrike &&
                WEXRow.modifiedExpiry === modifiedExpiry,
            ),
        );

        WEXArrayFilteredByDRV = WEXArrayFilteredByDRV.concat(filteredByDRV);
      }

      // Separate WEX Array Filtered By DRV by date
      const WEXArrayFilteredByDRVSeparatedByDates: IWEXInterfaceObjectOfArrays =
        WEXArrayFilteredByDRV.reduce((arr, WEX) => {
          arr[WEX.modifiedDate!] = arr[WEX.modifiedDate!] || [];
          arr[WEX.modifiedDate!].push(WEX);
          return arr;
        }, Object.create(null));

      // Grouping WEX by date, user, side, security, root, expiry, strike, call/put, portfolio, commission type, commission rate
      const groupedWEXArray = WEXGroupBy(
        WEXArrayFilteredByDRV,
        (element: IWEXInterface) => {
          return [
            element.modifiedDate,
            element.modifiedUser,
            element.modifiedSide,
            element.modifiedSecurity,
            element.modifiedRoot,
            element.modifiedExpiry,
            element.modifiedStrike,
            element.modifiedCallPut,
            element.modifiedPortfolio,
            element.modifiedCommissionType,
            element.modifiedCommissionRate,
          ];
        },
      );

      // Get WEX group keys
      const groupedWEXArrayKeys = Object.keys(groupedWEXArray);

      // Third step - grouping source
      for (const element of groupedWEXArrayKeys) {
        let weightAverageExecQty = 0;
        let totalExecQty = 0;
        const groupedWEXArrayCalculated: IWEXInterface[] = [
          ...groupedWEXArray[element]
            .reduce((array, object) => {
              const key = `${object.modifiedDate}-${object.modifiedSide}-${object.modifiedSecurity}-${object.modifiedRoot}-${object.modifiedExpiry}-${object.modifiedStrike}-${object.modifiedCallPut}-${object.modifiedPortfolio}-${object.modifiedCommissionType}-${object.modifiedCommissionRate}`;
              const item: IWEXInterface =
                array.get(key) ||
                Object.assign({}, object, {
                  modifiedExecQty: 0,
                  modifiedAveragePrice: 0,
                  modifiedTotalCharge: 0,
                });

              item.modifiedExecQty =
                item.modifiedExecQty! + object.modifiedExecQty!;

              const curWeightAverageExecQty =
                object.modifiedExecQty! * object.modifiedAveragePrice!;

              weightAverageExecQty += curWeightAverageExecQty;
              totalExecQty += object.modifiedExecQty!;

              item.modifiedAveragePrice =
                Math.round(
                  (weightAverageExecQty / totalExecQty + Number.EPSILON) * 100,
                ) / 100;

              item.modifiedTotalCharge = Number(
                (
                  item.modifiedTotalCharge! + object.modifiedTotalCharge!
                ).toFixed(2),
              );

              return array.set(key, item);
            }, new Map())
            .values(),
        ];

        WEXArrayGrouped = WEXArrayGrouped.concat(groupedWEXArrayCalculated);
      }

      const WEXUniqueDatesGrouped = WEXUniqueDatesArray(WEXArrayGrouped);

      // Separate WEX grouped by date
      const WEXGroupedArraySeparatedByDates: IWEXInterfaceObjectOfArrays =
        WEXArrayGrouped.reduce((arr, WEX) => {
          arr[WEX.modifiedDate!] = arr[WEX.modifiedDate!] || [];
          arr[WEX.modifiedDate!].push(WEX);
          return arr;
        }, Object.create(null));

      // Fourth step - group of execution from source V 1 execution in target
      for (const date of WEXUniqueDatesGrouped) {
        // Check if date is valid
        if (!date) {
          ServerGlobal.getInstance().logger.error(
            "<addDerivatives>: Failed because date is invalid",
          );

          res.status(400).send({
            success: false,
            message: "date is invalid",
          });
          return;
        }

        const filteredWEXGrouped = WEXGroupedArraySeparatedByDates[date].filter(
          (WEXRow) =>
            !DRVArraySeparatedByDates[date].find(
              ({
                modifiedDate,
                modifiedSide,
                modifiedSymbol,
                modifiedExpiry,
                modifiedStrike,
                modifiedOption,
                modifiedPrice,
                modifiedQuantity,
              }) =>
                WEXRow.modifiedDate === modifiedDate &&
                WEXRow.modifiedSide === modifiedSide &&
                WEXRow.modifiedRoot === modifiedSymbol &&
                WEXRow.modifiedCallPut === modifiedOption &&
                WEXRow.modifiedExecQty === modifiedQuantity &&
                WEXRow.modifiedAveragePrice === modifiedPrice &&
                WEXRow.modifiedStrike === modifiedStrike &&
                WEXRow.modifiedExpiry === modifiedExpiry,
            ),
        );

        WEXGroupedArrayFilteredByDRV =
          WEXGroupedArrayFilteredByDRV.concat(filteredWEXGrouped);
      }

      const WEXUniqueDatesGroupedByFilteredDRV = WEXUniqueDatesArray(
        WEXGroupedArrayFilteredByDRV,
      );

      // Separate WEX grouped by date
      const WEXGroupedArrayFilteredByDRVSeparatedByDates: IWEXInterfaceObjectOfArrays =
        WEXGroupedArrayFilteredByDRV.reduce((arr, WEX) => {
          arr[WEX.modifiedDate!] = arr[WEX.modifiedDate!] || [];
          arr[WEX.modifiedDate!].push(WEX);
          return arr;
        }, Object.create(null));

      // Fifth step - group of execution from source V 1 execution in target
      for (const date of WEXUniqueDatesGroupedByFilteredDRV) {
        // Check if date is valid
        if (!date) {
          ServerGlobal.getInstance().logger.error(
            "<addDerivatives>: Failed because date is invalid",
          );

          res.status(400).send({
            success: false,
            message: "date is invalid",
          });
          return;
        }

        const filterdGroupedByWEX = WEXArrayFilteredByDRVSeparatedByDates[
          date!
        ].filter((WEXRow) =>
          WEXGroupedArrayFilteredByDRVSeparatedByDates[date!].find(
            ({
              modifiedDate,
              modifiedUser,
              modifiedSide,
              modifiedSecurity,
              modifiedRoot,
              modifiedExpiry,
              modifiedStrike,
              modifiedCallPut,
              modifiedPortfolio,
              modifiedCommissionType,
              modifiedCommissionRate,
            }) =>
              WEXRow.modifiedDate === modifiedDate &&
              WEXRow.modifiedUser === modifiedUser &&
              WEXRow.modifiedSide === modifiedSide &&
              WEXRow.modifiedSecurity === modifiedSecurity &&
              WEXRow.modifiedRoot === modifiedRoot &&
              WEXRow.modifiedExpiry === modifiedExpiry &&
              WEXRow.modifiedStrike === modifiedStrike &&
              WEXRow.modifiedCallPut === modifiedCallPut &&
              WEXRow.modifiedPortfolio === modifiedPortfolio &&
              WEXRow.modifiedCommissionType === modifiedCommissionType &&
              WEXRow.modifiedCommissionRate === modifiedCommissionRate,
          ),
        );

        WEXfilterdByGroupedWEX =
          WEXfilterdByGroupedWEX.concat(filterdGroupedByWEX);
      }

      const WEXUniqueDatesGroupedByWEXGrouped = WEXUniqueDatesArray(
        WEXfilterdByGroupedWEX,
      );

      // Grouping DRV by drv_trade_id, floor_broker, date, side, component_type, contract_type, symbol, expiry, strike, option, client_id
      const groupedDRVArray = DRVGroupBy(
        modifiedDRV,
        (element: IDRVInterface) => {
          return [
            element.drv_trade_id,
            element.floor_broker,
            element.modifiedDate,
            element.modifiedSide,
            element.component_type,
            element.contract_type,
            element.modifiedSymbol,
            element.modifiedExpiry,
            element.modifiedStrike,
            element.modifiedOption,
            element.client_id,
          ];
        },
      );

      // Get WEX group keys
      const groupedDRVArrayKeys = Object.keys(groupedDRVArray);

      // Sixth step - group of execution from source V group of executions in target
      for (const element of groupedDRVArrayKeys) {
        let weightAverageExecQty = 0;
        let totalExecQty = 0;
        const groupedDRVArrayCalculated: IDRVInterface[] = [
          ...groupedDRVArray[element]
            .reduce((array, object) => {
              const key = `${object.drv_trade_id}-${object.floor_broker}-${object.modifiedDate}-${object.modifiedSide}-${object.component_type}-${object.contract_type}-${object.modifiedSymbol}-${object.modifiedExpiry}-${object.modifiedStrike}-${object.modifiedOption}-${object.client_id}`;
              const item: IDRVInterface =
                array.get(key) ||
                Object.assign({}, object, {
                  modifiedQuantity: 0,
                  modifiedPrice: 0,
                });

              item.modifiedQuantity =
                item.modifiedQuantity! + object.modifiedQuantity!;

              const curWeightAverageExecQty =
                object.modifiedQuantity! * object.modifiedPrice!;

              weightAverageExecQty += curWeightAverageExecQty;
              totalExecQty += object.modifiedQuantity!;

              item.modifiedPrice =
                Math.round(
                  (weightAverageExecQty / totalExecQty + Number.EPSILON) * 100,
                ) / 100;

              return array.set(key, item);
            }, new Map())
            .values(),
        ];

        DRVArrayGrouped = DRVArrayGrouped.concat(groupedDRVArrayCalculated);
      }

      // Separate DRV Array Grouped by date
      const DRVArrayGroupedSeparatedByDates: IDRVInterfaceObjectOfArrays =
        DRVArrayGrouped.reduce((arr, WEX) => {
          arr[WEX.modifiedDate!] = arr[WEX.modifiedDate!] || [];
          arr[WEX.modifiedDate!].push(WEX);
          return arr;
        }, Object.create(null));

      // Seventh step - group of execution from source V group of executions in target
      for (const date of WEXUniqueDatesGroupedByWEXGrouped) {
        // Check if date is valid
        if (!date) {
          ServerGlobal.getInstance().logger.error(
            "<addDerivatives>: Failed because date is invalid",
          );

          res.status(400).send({
            success: false,
            message: "date is invalid",
          });
          return;
        }

        const filterdGroupedByWEX = WEXGroupedArraySeparatedByDates[
          date
        ].filter(
          (WEXRow) =>
            !DRVArrayGroupedSeparatedByDates[date].find(
              ({
                modifiedDate,
                modifiedSide,
                modifiedSymbol,
                modifiedExpiry,
                modifiedStrike,
                modifiedOption,
                modifiedPrice,
                modifiedQuantity,
              }) =>
                WEXRow.modifiedDate === modifiedDate &&
                WEXRow.modifiedSide === modifiedSide &&
                WEXRow.modifiedRoot === modifiedSymbol &&
                WEXRow.modifiedCallPut === modifiedOption &&
                WEXRow.modifiedExecQty === modifiedQuantity &&
                WEXRow.modifiedAveragePrice === modifiedPrice &&
                WEXRow.modifiedStrike === modifiedStrike &&
                WEXRow.modifiedExpiry === modifiedExpiry,
            ),
        );

        WEXfilterdByGroupedDRV =
          WEXfilterdByGroupedDRV.concat(filterdGroupedByWEX);
      }

      const WEXUniqueDatesGroupedByFilterdGroupedDRV = WEXUniqueDatesArray(
        WEXfilterdByGroupedDRV,
      );

      // Separate WEXfilterdByGroupedDRV by date
      const WEXfilterdByGroupedDRVSeparatedByDates: IWEXInterfaceObjectOfArrays =
        WEXfilterdByGroupedDRV.reduce((arr, WEX) => {
          arr[WEX.modifiedDate!] = arr[WEX.modifiedDate!] || [];
          arr[WEX.modifiedDate!].push(WEX);
          return arr;
        }, Object.create(null));

      // Eighth step - group of execution from source V group of executions in target
      for (const date of WEXUniqueDatesGroupedByFilterdGroupedDRV) {
        // Check if date is valid
        if (!date) {
          ServerGlobal.getInstance().logger.error(
            "<addDerivatives>: Failed because date is invalid",
          );

          res.status(400).send({
            success: false,
            message: "date is invalid",
          });
          return;
        }

        const filterdGroupedByWEX = WEXArrayFilteredByDRVSeparatedByDates[
          date
        ].filter((WEXRow) =>
          WEXfilterdByGroupedDRVSeparatedByDates[date].find(
            ({
              modifiedDate,
              modifiedUser,
              modifiedSide,
              modifiedSecurity,
              modifiedRoot,
              modifiedExpiry,
              modifiedStrike,
              modifiedCallPut,
              modifiedPortfolio,
              modifiedCommissionType,
              modifiedCommissionRate,
            }) =>
              WEXRow.modifiedDate === modifiedDate &&
              WEXRow.modifiedUser === modifiedUser &&
              WEXRow.modifiedSide === modifiedSide &&
              WEXRow.modifiedSecurity === modifiedSecurity &&
              WEXRow.modifiedRoot === modifiedRoot &&
              WEXRow.modifiedExpiry === modifiedExpiry &&
              WEXRow.modifiedStrike === modifiedStrike &&
              WEXRow.modifiedCallPut === modifiedCallPut &&
              WEXRow.modifiedPortfolio === modifiedPortfolio &&
              WEXRow.modifiedCommissionType === modifiedCommissionType &&
              WEXRow.modifiedCommissionRate === modifiedCommissionRate,
          ),
        );

        unresolved = unresolved.concat(filterdGroupedByWEX);
      }

      // convert JSON to CSV file
      converter.json2csv(unresolved, (err, csv) => {
        if (err) {
          ServerGlobal.getInstance().logger.info(
            `<addDerivatives>: Failed to convert file to csv because of error: ${err}`,
          );

          res.status(400).send({
            success: false,
            message: "Failed to convert file to csv",
          });
          return;
        }

        if (!csv) {
          ServerGlobal.getInstance().logger.info(
            "<addDerivatives>: Failed to convert file to csv",
          );

          res.status(400).send({
            success: false,
            message: "Failed to convert file to csv",
          });
          return;
        }

        fs.writeFileSync(
          `assets/unresolved-${userByID.username}-${formattedDate}.csv`,
          csv,
        );

        ServerGlobal.getInstance().logger.info(
          `<addDerivatives>: Successfully created the unresolved-${userByID.username}-${formattedDate}.csv to dir`,
        );
      });

      // Calculate matched rows
      const matchedRows = modifiedWEX.length - unresolved.length;

      // Calculate complete percentage
      const completePercentageRows = (matchedRows * 100) / modifiedWEX.length;

      // Saving the derivative document in DB
      await Derivative.create({
        date: formattedDate,
        wex: `WEX-${userByID.username}-${formattedDate}.csv`,
        drv: `DRV-${userByID.username}-${formattedDate}.csv`,
        matched: matchedRows,
        unmatched: unresolved.length,
        complete: completePercentageRows,
        unresolved: `unresolved-${userByID.username}-${formattedDate}.csv`,
        username: userByID.username,
      });

      res.status(200).send({
        success: true,
        message: "Successfully added derivative",
      });
      return;
    };
  } catch (e) {
    ServerGlobal.getInstance().logger.error(
      `<addDerivatives>: Failed to add derivatives data because of server error: ${e}`,
    );

    res.status(500).send({
      success: false,
      message: "Server error",
    });
    return;
  }
};

const getDerivatives = async (
  req: IGetDerivativesRequest,
  res: IGetDerivativesResponse,
) => {
  ServerGlobal.getInstance().logger.info(
    `<getDerivatives>: Start processing request`,
  );

  try {
    // Get derivatives
    const derivatives = await Derivative.findAll();

    // Check if derivatives are valid
    if (!derivatives) {
      ServerGlobal.getInstance().logger.error(
        "<getDerivatives>: Failed to get derivatives",
      );

      res.status(400).send({
        success: false,
        message: "derivatives are invalid",
      });
      return;
    }

    ServerGlobal.getInstance().logger.info(
      `<getDerivatives>: Successfully got the derivatives`,
    );

    res.status(200).send({
      success: true,
      message: "Successfully retrieved movies",
      data: derivatives.map((derivative) => ({
        id: derivative.id,
        date: derivative.date,
        username: derivative.username,
        wex: derivative.wex,
        drv: derivative.drv,
        matched: derivative.matched,
        unmatched: derivative.unmatched,
        complete: derivative.complete,
        unresolved: derivative.unresolved,
      })),
    });
    return;
  } catch (e) {
    ServerGlobal.getInstance().logger.error(
      `<getDerivatives>: Failed to get derivatives because of server error: ${e}`,
    );

    res.status(500).send({
      success: false,
      message: "Server error",
    });
    return;
  }
};

const getDerivative = async (
  req: IGetDerivativeRequest,
  res: IGetDerivativeResponse,
) => {
  ServerGlobal.getInstance().logger.info(
    `<getDerivative>: Start processing request`,
  );

  try {
    // Get derivative
    const derivative = await Derivative.findOne({
      order: [["id", "DESC"]],
    });

    // Check if derivatives are valid
    if (!derivative) {
      ServerGlobal.getInstance().logger.error(
        "<getDerivative>: Failed to get derivatives",
      );

      res.status(400).send({
        success: false,
        message: "derivatives are invalid",
      });
      return;
    }

    ServerGlobal.getInstance().logger.info(
      `<getDerivatives>: Successfully got the derivatives`,
    );

    res.status(200).send({
      success: true,
      message: "Successfully retrieved movies",
      data: {
        wex: derivative.wex,
        drv: derivative.drv,
        matched: derivative.matched,
        unmatched: derivative.unmatched,
        complete: derivative.complete,
        username: derivative.username,
        unresolved: derivative.unresolved,
      },
    });
    return;
  } catch (e) {
    ServerGlobal.getInstance().logger.error(
      `<getDerivatives>: Failed to get derivatives because of server error: ${e}`,
    );

    res.status(500).send({
      success: false,
      message: "Server error",
    });
    return;
  }
};

const getDerivativeFiles = async (req: IDownloadFilesRequest, res: any) => {
  ServerGlobal.getInstance().logger.info(
    `<getDerivativeFiles>: Start processing request`,
  );

  try {
    const fileName = req.params.fileId;
    const filePath = __dirname + "../../../assets/" + fileName;

    // Check file path
    if (!filePath) {
      ServerGlobal.getInstance().logger.error(
        "<getDerivative>: Failed to get file",
      );

      res.status(400).send({
        success: false,
        message: "file is invalid",
      });
      return;
    }

    res.download(filePath, fileName);
  } catch (e) {
    ServerGlobal.getInstance().logger.error(
      `<getDerivatives>: Failed to download files because of server error: ${e}`,
    );

    res.status(500).send({
      success: false,
      message: "Server error",
    });
    return;
  }
};

export { addDerivatives, getDerivatives, getDerivative, getDerivativeFiles };
