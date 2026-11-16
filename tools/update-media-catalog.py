"""Refresh the curated catalogue from official embeds and explicitly marked archive items.
No arbitrary stream discovery or DRM/proxy extraction. Review generated credits before release.
"""
import concurrent.futures, datetime, json, re, urllib.parse, urllib.request
from pathlib import Path
DEST=Path('src/media/catalog.json')
STAMP='2026-11-15'
def get(url):
    request=urllib.request.Request(url,headers={'User-Agent':'BackInTheDay-CatalogReview/1.0'})
    with urllib.request.urlopen(request,timeout=18) as response:return json.load(response)
videos=[
 ('fJ9rUzIMcZQ','70s'),('Gs069dndIYk','70s'),('fNFzfwLM72c','70s'),
 ('djV11Xbc914','80s'),('dQw4w9WgXcQ','80s'),('FTQbiNvZqaY','80s'),('sOnqjkJTMaA','80s'),('lDK9QqIzhwk','80s'),('aGCdLKXNF3w','80s'),('PIb6AZdTr-A','80s'),
 ('hTWKbfoikeg','90s'),('vabnZ9-ex7o','90s'),('4fndeDfaWCg','90s'),('3JWTaaS7LdU','90s'),('fPO76Jlnz6c','90s'),('bx1Bh8ZvH84','90s'),('XFkzRNyygfk','90s'),('xwtdhWltSIg','90s'),('4aeETEoNfOg','90s'),('ks_qOI0lzho','90s'),
 ('04mfKJWDSzI','2000s'),('PWgvGjAhvIw','2000s'),('eVTXPUF4Oz4','2000s'),('K7l5ZeVVoCA','2000s'),('v2AC41dglnM','90s'),
 ('5NV6Rdv1a3I','2010s'),('4NRXx6U8ABQ','2020s'),('TUVcZfQe-Kw','2020s'),('b1kbLwvqugk','2020s')]
live=[('HvZt-nh9sGg','France 24 English','https://www.france24.com/en/live'),('Ap-UM1O9RBU','France 24 English - alternate feed','https://www.france24.com/en/live'),('LuKwFajn37U','DW News','https://www.dw.com/en/live-tv/channel-english'),('gCNeDWCI0vo','Al Jazeera English','https://www.aljazeera.com/live'),('jfKfPfyJRdk','Lofi Girl - beats to relax / study','https://www.youtube.com/@LofiGirl')]
def video(spec):
    identifier,era=spec
    try:
        url='https://www.youtube.com/watch?v='+identifier
        meta=get('https://www.youtube.com/oembed?format=json&url='+urllib.parse.quote(url,safe=''))
        return dict(id='yt-'+identifier,title=meta['title'],kind='music-video',genre='Music videos',era=era,year='',playback='youtube',url=identifier,source=url,credit=meta['author_name']+' / official YouTube player',note='Hosted video. Ads, region limits and embedding availability are controlled by YouTube and the publisher.',verified=STAMP)
    except Exception as error:print('SKIP VIDEO',identifier,str(error)[:90])
def live_video(spec):
    identifier,title,source=spec
    item=video((identifier,'Now'))
    if item:
        item.update(id='live-'+identifier,title=title,kind='live',genre='Chill radio' if 'Lofi' in title else 'Live news',source=source,note='Publisher-hosted live feed. It may go off air or change address; the source link is always available. Not a rebroadcast or downloadable recording.')
    return item
films=[('Night of the Living Dead','1968','Horror'),('Carnival of Souls','1962','Horror'),('House on Haunted Hill','1959','Horror'),('Plan 9 from Outer Space','1959','Science fiction'),('The Last Man on Earth','1964','Science fiction'),('The Little Shop of Horrors','1960','Horror comedy'),('Dementia 13','1963','Horror'),('Detour','1945','Film noir'),('The Stranger','1946','Film noir'),('The Hitch-Hiker','1953','Film noir'),('White Zombie','1932','Horror'),('Nosferatu','1922','Silent horror'),('Sherlock Jr','1924','Silent comedy'),('Steamboat Bill Jr','1928','Silent comedy'),('The Kid','1921','Silent comedy'),('The Lost World','1925','Adventure'),('The Phantom of the Opera','1925','Silent horror'),('Popeye the Sailor Meets Sindbad the Sailor','1936','Cartoons'),('Superman The Mechanical Monsters','1941','Cartoons'),('A Trip to the Moon','1902','Silent science fiction')]
def film(spec):
    title,year,genre=spec
    try:
        q='title:"'+title+'" AND mediatype:movies AND (licenseurl:*publicdomain* OR licenseurl:*by*)'
        response=get('https://archive.org/advancedsearch.php?'+urllib.parse.urlencode({'q':q,'output':'json','rows':8,'fl[]':'identifier','sort[]':'downloads desc'}))
        for found in response['response']['docs']:
            identifier=found['identifier'];meta=get('https://archive.org/metadata/'+identifier);md=meta.get('metadata',{});lic=str(md.get('licenseurl',''))
            # Only explicit public-domain marks for these historical feature candidates.
            if 'publicdomain' not in lic:continue
            files=[f for f in meta.get('files',[]) if f.get('name','').lower().endswith('.mp4') and int(f.get('size',0))>1000000 and 'trailer' not in f['name'].lower()]
            if not files:continue
            files.sort(key=lambda f:(0 if '512kb' in f['name'] else 1,int(f.get('size',0))))
            f=files[0]
            return dict(id='film-'+re.sub('[^a-z0-9]+','-',title.lower()).strip('-'),title=title,kind='movie',genre=genre,year=year,era=year[:3]+'0s',playback='video',url='https://archive.org/download/'+identifier+'/'+urllib.parse.quote(f['name']),source='https://archive.org/details/'+identifier,credit=str(md.get('creator','Original filmmakers'))+' / '+lic,note='Original film; US public-domain status. Archive item is explicitly marked public domain. Specific transfer and international rights may differ.',verified=STAMP)
        print('SKIP FILM',title,'no explicitly marked playable copy')
    except Exception as error:print('SKIP FILM',title,str(error)[:90])
def main():
    existing=json.loads(DEST.read_text(encoding='utf-8')) if DEST.exists() else []
    items=[x for x in existing if not x['id'].startswith(('yt-','live-','film-'))]
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
        for result in pool.map(video,videos):
            if result:items.append(result)
        for result in pool.map(live_video,live):
            if result:items.append(result)
        for result in pool.map(film,films):
            if result:items.append(result)
    DEST.parent.mkdir(parents=True,exist_ok=True);DEST.write_text(json.dumps(items,ensure_ascii=True,indent=2)+'\n',encoding='utf-8')
    print('SAVED',len(items),'items:',{kind:sum(x['kind']==kind for x in items) for kind in sorted({x['kind'] for x in items})})
if __name__=='__main__':main()
