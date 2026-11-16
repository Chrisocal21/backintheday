import { readFileSync } from 'node:fs'

export function readCatalog(){
  return JSON.parse(readFileSync(new URL('../src/media/catalog.json',import.meta.url),'utf8'))
}
export function catalogResponse(path){
  const url=new URL(path,'http://localhost')
  if(url.pathname==='/api/catalog'){
    const q=(url.searchParams.get('q')||'').slice(0,160).toLowerCase(),kind=url.searchParams.get('kind')||'all'
    const items=readCatalog().filter(item=>(kind==='all'||item.kind===kind)&&`${item.title} ${item.genre} ${item.credit}`.toLowerCase().includes(q))
    const offset=Math.max(0,Math.min(10000,Number.parseInt(url.searchParams.get('offset')||'0')||0)),limit=Math.max(1,Math.min(200,Number.parseInt(url.searchParams.get('limit')||'200')||200))
    return {status:200,body:{items:items.slice(offset,offset+limit),total:items.length,offset,limit,version:1}}
  }
  if(url.pathname.startsWith('/api/media/')){
    const id=url.pathname.slice('/api/media/'.length),item=readCatalog().find(i=>i.id===id)
    return item?{status:200,body:item}:{status:404,body:{error:'Title not found'}}
  }
  return {status:404,body:{error:'Endpoint not found'}}
}
export function handleCatalog(req,res){
  if(!['GET','HEAD'].includes(req.method||'GET')){res.writeHead(405,{'Allow':'GET, HEAD'});res.end();return}
  try{const result=catalogResponse(req.url||'/api/catalog');res.writeHead(result.status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'public, max-age=300','X-Content-Type-Options':'nosniff'});res.end(req.method==='HEAD'?undefined:JSON.stringify(result.body))}
  catch{res.writeHead(500,{'Content-Type':'application/json'});res.end(JSON.stringify({error:'Catalog temporarily unavailable'}))}
}
export function mediaCatalogPlugin(){return {name:'free-media-catalog',configureServer(server){server.middlewares.use('/api',(req,res)=>{req.url='/api'+(req.url||'');handleCatalog(req,res)})},configurePreviewServer(server){server.middlewares.use('/api',(req,res)=>{req.url='/api'+(req.url||'');handleCatalog(req,res)})}}}
