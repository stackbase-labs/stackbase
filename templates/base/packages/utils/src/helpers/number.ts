export const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export const round = (value: number, decimals = 2) => Number(value.toFixed(decimals));
