import { Request, Response, NextFunction } from 'express';

export const flattenQuery = (req: Request, _res: Response, next: NextFunction) => {
  for (const key in req.query) {
    const val = req.query[key];
    if (Array.isArray(val) && val.length === 1) {
      req.query[key] = val[0];
    }
  }
  next();
};