import type { PrintOrientation, PrintPaper } from './printGeometry';

export type PrintOptions = {
  repeatHeader?: boolean;
  fitWidth?: boolean;
  pageNumbers?: boolean;
  paper?: PrintPaper;
  orientation?: PrintOrientation;
};
