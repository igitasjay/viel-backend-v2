import { ZodObject } from 'zod';
import { Request, Response, NextFunction } from 'express';

export const validate =
  (schema: ZodObject) => (req: Request, res: Response, next: NextFunction) => {
    const data = { body: req.body, query: req.query, params: req.params };
    const parsed = schema.safeParse(data);
    if (!parsed.success)
      return res
        .status(400)
        .json({ success: false, errors: parsed.error.format() });
    // attach parsed to request
    (req as any).validated = parsed.data;
    next();
  };
