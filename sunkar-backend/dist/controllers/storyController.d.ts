import type { Request, Response } from "express";
export declare function getHistoryHandler(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function generateStoryStreamHandler(req: Request, res: Response): Promise<void>;
export declare function generateStoryHandler(req: Request, res: Response): Promise<void>;
export declare function clearSessionHandler(req: Request, res: Response): Promise<void>;
export declare const loadSessionHandler: (req: Request, res: Response) => void;
//# sourceMappingURL=storyController.d.ts.map