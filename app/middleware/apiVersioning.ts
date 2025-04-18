import { Request, Response, NextFunction } from 'express';

export const urlVersioning = (version: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith(`/api/${version}`)) {
      next();
    } else {
      res.status(404).json({
        success: false,
        error: 'API version is not supported',
      });
    }
  };
};

export const headerVersioning = (version: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.get('Accept-Version') === version) {
      next();
    } else {
      res.status(404).json({
        success: false,
        error: 'API version is not supported',
      });
    }
  };
};

export const contentTypeVersioning = (version: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentType = req.get('Content-Type');

    if (
      contentType &&
      contentType.includes(`application/vnd.api.${version}+json`)
    ) {
      next();
    } else {
      res.status(404).json({
        success: false,
        error: 'API version is not supported',
      });
    }
  };
};
