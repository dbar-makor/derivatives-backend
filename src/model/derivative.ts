import Sequelize, { Optional } from "sequelize";
import ServerGlobal from "../server-global";

import IDBAttribute from "./shared/db-table";

interface IDerivativesAttributes extends IDBAttribute {
  readonly date: string;
  readonly username: string;
  readonly floorBrokerID: number;
  readonly wex: string;
  readonly fileName: string;
  readonly totalCount: number;
  readonly totalCharge: number;
  readonly matchedCount: number;
  readonly matchSumCharge: number;
  readonly matchedSumPercentage: number;
  readonly unmatchedCount: number;
  readonly unmatchedGroupCount: number;
  readonly unmatchedSumCharge: number;
  readonly unmatchedSumPercentage: number;
  readonly unresolved: string;
}

class Derivative
  extends Sequelize.Model<
    Optional<IDerivativesAttributes, "id" | "date" | "createdAt">
  >
  implements IDerivativesAttributes
{
  public readonly id!: number;
  public readonly date!: string;
  public readonly username!: string;
  public readonly floorBrokerID!: number;
  public readonly wex!: string;
  public readonly fileName!: string;
  public readonly totalCount!: number;
  public readonly totalCharge!: number;
  public readonly matchedCount!: number;
  public readonly matchSumCharge!: number;
  public readonly matchedSumPercentage!: number;
  public readonly unmatchedCount!: number;
  public readonly unmatchedGroupCount!: number;
  public readonly unmatchedSumCharge!: number;
  public readonly unmatchedSumPercentage!: number;
  public readonly unresolved!: string;
}

Derivative.init(
  {
    id: {
      type: Sequelize.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
      unique: true,
    },
    date: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    username: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    floorBrokerID: {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: false,
    },
    wex: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    fileName: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    totalCount: {
      type: Sequelize.INTEGER.UNSIGNED,
    },
    totalCharge: {
      type: Sequelize.INTEGER.UNSIGNED,
    },
    matchedCount: {
      type: Sequelize.INTEGER.UNSIGNED,
    },
    matchSumCharge: {
      type: Sequelize.INTEGER.UNSIGNED,
    },
    matchedSumPercentage: {
      type: Sequelize.INTEGER.UNSIGNED,
    },
    unmatchedCount: {
      type: Sequelize.INTEGER.UNSIGNED,
    },
    unmatchedGroupCount: {
      type: Sequelize.INTEGER.UNSIGNED,
    },
    unmatchedSumCharge: {
      type: Sequelize.INTEGER.UNSIGNED,
    },
    unmatchedSumPercentage: {
      type: Sequelize.INTEGER.UNSIGNED,
    },
    unresolved: {
      type: Sequelize.STRING,
      allowNull: false,
    },
  },
  {
    tableName: "derivatives",
    sequelize: ServerGlobal.getInstance().db,
    createdAt: false,
    updatedAt: false,
  }
);

export default Derivative;
