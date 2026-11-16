export type MediaKind='live'|'movie'|'music-video'|'radio'|'service'|'game-service'
export type MediaItem={id:string;title:string;kind:MediaKind;genre:string;era:string;year:string;playback:'video'|'youtube'|'external';url:string;source:string;credit:string;note:string;verified:string}
