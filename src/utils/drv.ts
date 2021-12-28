import { IDRVInterface } from "../model/shared/derivatives";

// Formatting DRV date
export const formatDRVDate = (date: string) => {
  if (!date) {
    return date;
  }
  const day = date.toString().split("-")[2];
  const removeLeadingZeroDay = parseInt(day, 10);
  const month = date.toString().split("-")[1];
  const removeLeadingZeroMonth = parseInt(month, 10);
  const year = date.toString().split("-")[0];
  return (date = `${removeLeadingZeroMonth}/${removeLeadingZeroDay}/${year}`);
};

// Grouping DRV array
export const DRVGroupBy = (
  array: IDRVInterface[],
  f: (element: IDRVInterface) => (string | number | undefined)[]
) => {
  const groups: { [key: string]: IDRVInterface[] } = {};

  array.forEach((object) => {
    const group = f(object).join("-");

    groups[group] = groups[group] || [];
    groups[group].push(object);
  });
  return groups;
};
