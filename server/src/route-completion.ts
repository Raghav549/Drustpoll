import type {IncomingMessage,ServerResponse} from 'node:http';
export const sendJson=(res:ServerResponse,status:number,body:unknown,json:(res:ServerResponse,status:number,body:unknown)=>unknown)=>json(res,status,body);
export const readBody=async(req:IncomingMessage)=>{let data='';for await(const chunk of req){data+=chunk;if(Buffer.byteLength(data)>256*1024)throw new Error('Request too large');}return data?JSON.parse(data):{};};
