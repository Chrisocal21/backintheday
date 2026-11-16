import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useLibraryShelf=create<{favorites:string[];recent:string[];toggle:(key:string)=>void;remember:(key:string)=>void}>()(persist((set)=>({
  favorites:[],recent:[],
  toggle:key=>set(s=>({favorites:s.favorites.includes(key)?s.favorites.filter(k=>k!==key):[...s.favorites,key]})),
  remember:key=>set(s=>({recent:[key,...s.recent.filter(k=>k!==key)].slice(0,100)})),
}),{name:'back-in-the-day-library-shelf',version:1}))
