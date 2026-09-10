export const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

export const truncate = (str: string, maxLength: number) =>
  str.length > maxLength ? str.slice(0, maxLength) + '…' : str;

export const isEmpty = (str: string) => !str || str.trim().length === 0;
