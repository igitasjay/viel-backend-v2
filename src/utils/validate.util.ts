import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

export const validate =
  (schema: z.ZodTypeAny) => (req: Request, res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success)
      return res
        .status(400)
        .json({ success: false, errors: parsed.error.format() });
    req.body = parsed.data;
    next();
  };
