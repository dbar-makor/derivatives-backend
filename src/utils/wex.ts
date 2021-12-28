import { IWEXInterface } from "../model/shared/derivatives";

// Convert WEX array to unique dates only array
export const WEXUniqueDatesArray = (array: IWEXInterface[]) => {
  if (!array) {
    return array;
  }
  const dates = array.map((date: IWEXInterface) => date.modifiedDate);
  const uniqueDates = dates.filter((item, pos) => dates.indexOf(item) == pos);

  return uniqueDates;
};

// Formatting WEX date
export const formatWEXExpiry = (date: string) => {
  if (!date) {
    return date;
  }
  const day = date!.split("/")[0];
  const month = date.split("/")[1];
  const removeLeadingZeroMonth = parseInt(month, 10);
  const year = date.split("/")[2];
  return (date = `${removeLeadingZeroMonth}/${day}/${year}`);
};

export const formatWEXDate = (date: string) => {
  if (!date) {
    return date;
  }
  const month = date.toString().split("/")[0];
  const removeLeadingZeroMonth = parseInt(month, 10);
  const day = date.toString().split("/")[1];
  const removeLeadingZeroDay = parseInt(day, 10);
  const year = date.toString().split("/")[2];
  return (date = `${removeLeadingZeroMonth}/${removeLeadingZeroDay}/${year}`);
};

// Grouping WEX array
export const WEXGroupBy = (
  array: IWEXInterface[],
  f: (element: IWEXInterface) => (string | number | undefined)[]
) => {
  if (!array) {
    return array;
  }
  const groups: { [key: string]: IWEXInterface[] } = {};

  array.forEach((object) => {
    const group = f(object).join("-");

    groups[group] = groups[group] || [];
    groups[group].push(object);
  });
  return groups;
};
