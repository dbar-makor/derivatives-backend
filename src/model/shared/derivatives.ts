export interface IWEXObject {
  [key: string]: IWEX[];
}

export interface IDRVObject {
  [key: string]: IDRV[];
}

export interface IWEX {
  readonly User?: string;
  readonly Date?: string;
  readonly Route?: string;
  readonly Side?: string;
  readonly "Exec Qty"?: string;
  readonly Security?: string;
  readonly Root?: string;
  readonly Expiry?: string;
  readonly Strike?: string;
  readonly "Call/Put"?: string;
  readonly "Average Price"?: string;
  readonly Portfolio?: string;
  readonly "Commission Type"?: string;
  readonly "Commission Rate"?: string;
  readonly "WEX Connect Rate"?: string;
  readonly "Exch. Fee Rate"?: string;
  readonly "Clearing Fee"?: string;
  readonly "Total Charge"?: string;
  readonly modifiedDate?: string;
  readonly modifiedUser?: string;
  readonly modifiedSide?: string;
  modifiedExecQty?: number;
  readonly modifiedSecurity?: string;
  readonly modifiedRoot?: string;
  readonly modifiedExpiry?: string;
  readonly modifiedStrike?: number;
  readonly modifiedCallPut?: string;
  modifiedAveragePrice?: number;
  readonly modifiedPortfolio?: string;
  readonly modifiedCommissionType?: string;
  readonly modifiedCommissionRate?: number;
  modifiedTotalCharge?: number;
  removed?: boolean;
}

export interface IDRV {
  readonly drv_trade_id?: string;
  readonly drv_trade_client_trader_id?: string;
  readonly drv_trade_client_account_execution_id?: string;
  readonly floor_broker?: string;
  readonly date?: string;
  readonly side?: string;
  quantity?: string;
  readonly component_type?: string;
  readonly contract_type?: string;
  readonly symbol?: string;
  readonly expiry?: string;
  readonly strike?: string;
  readonly option?: string;
  price?: string;
  readonly client_id?: string;
  readonly client?: string;
  readonly trader?: string;
  readonly modifiedDate?: string;
  readonly modifiedSide?: string;
  modifiedQuantity?: number;
  readonly modifiedSymbol?: string;
  readonly modifiedExpiry?: string;
  readonly modifiedStrike?: number;
  readonly modifiedOption?: string;
  modifiedPrice?: number;
}
