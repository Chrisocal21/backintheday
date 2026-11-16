import { createServer } from 'node:http'
import { createReadStream,statSync } from 'node:fs'
import { resolve,sep,extname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { handleCatalog } from './catalog.mjs'
const root=fileURLToPath(new URL('../dist/',import.meta.url))
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.json':'application/json'}
createServer((req,res)=>{
  if(req.url?.startsWith('/api/'))return handleCatalog(req,res)
  if(!['GET','HEAD'].includes(req.method||'GET')){res.writeHead(405);return res.end()}
  let pathname;try{pathname=decodeURIComponent(new URL(req.url||'/','http://localhost').pathname)}catch{res.writeHead(400);return res.end()}
  let file=resolve(root,'.'+pathname)
  if(file!==resolve(root)&&!file.startsWith(resolve(root)+sep)){res.writeHead(403);return res.end()}
  try{if(statSync(file).isDirectory())file=resolve(file,'index.html');statSync(file)}catch{file=resolve(root,'index.html')}
  res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream','X-Content-Type-Options':'nosniff'})
  if(req.method==='HEAD')return res.end()
  const stream=createReadStream(file);stream.on('error',()=>res.destroy());stream.pipe(res)
}).listen(Number(process.env.PORT)||3000,()=>console.log('Back in the Day: http://localhost:'+(process.env.PORT||3000)))
