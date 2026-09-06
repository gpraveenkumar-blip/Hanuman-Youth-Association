import helmet from "helmet";
import rateLimit from "express-rate-limit";
export const security=helmet({crossOriginResourcePolicy:{policy:"cross-origin"}});
export const apiLimiter=rateLimit({windowMs:15*60*1000,max:300,standardHeaders:true,legacyHeaders:false});
export const authLimiter=rateLimit({windowMs:15*60*1000,max:10,message:{message:"Too many login attempts. Try again later."}});
