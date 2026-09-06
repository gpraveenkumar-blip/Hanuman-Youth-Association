import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
const secret=()=>process.env.JWT_SECRET||"dev-secret-change-me";
export type AuthRequest=Request & {adminId?:string};
export function signAdmin(id:string){return jwt.sign({sub:id,role:"admin"},secret(),{expiresIn:"8h"});}
export function requireAuth(req:AuthRequest,res:Response,next:NextFunction){
  try{const token=req.cookies?.hya_session;if(!token)return res.status(401).json({message:"Unauthorized"});const p=jwt.verify(token,secret()) as any;req.adminId=p.sub;next()}catch{return res.status(401).json({message:"Unauthorized"})}
}
