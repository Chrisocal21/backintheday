import { useEffect, useRef } from 'react'
import { useStore } from '../store'
import { GAMES, type GameId } from '../library'

// Original small games; no external ROMs, assets, or game services.
export function GameScreen({ id }: { id: GameId }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const playing = useStore(s => s.playingGame)
  useEffect(() => {
    const ctx = canvas.current!.getContext('2d')!
    const keys = new Set<string>()
    let raf = 0, last = 0, tick = 0
    let paddle = 220, cpu = 220, x = 320, y = 230, vx = 220, vy = 120, score = 0, other = 0, over = false
    let snake = [{x: 10, y: 9}, {x: 9, y: 9}, {x: 8, y: 9}], direction = {x: 1, y: 0}, pending = direction, food = {x: 19, y: 9}
    const reset = () => { paddle = cpu = 220; x = 320; y = 230; vx = 220; vy = 120; score = other = 0; over = false; snake = [{x:10,y:9},{x:9,y:9},{x:8,y:9}]; direction = pending = {x:1,y:0}; food = {x:19,y:9}; tick = 0 }
    const keydown = (e: KeyboardEvent) => {
      if (!useStore.getState().playingGame) return
      if (e.code === 'Escape') { useStore.getState().stopGame(); return }
      if (['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyW','KeyA','KeyS','KeyD'].includes(e.code)) e.preventDefault()
      keys.add(e.code)
      if (e.code === 'Space') reset()
      const next = e.code === 'KeyW' || e.code === 'ArrowUp' ? {x:0,y:-1} : e.code === 'KeyS' || e.code === 'ArrowDown' ? {x:0,y:1} : e.code === 'KeyA' || e.code === 'ArrowLeft' ? {x:-1,y:0} : e.code === 'KeyD' || e.code === 'ArrowRight' ? {x:1,y:0} : null
      if (next && next.x * direction.x + next.y * direction.y !== -1) pending = next
    }
    const keyup = (e: KeyboardEvent) => keys.delete(e.code)
    const blur = () => keys.clear()
    window.addEventListener('keydown', keydown)
    window.addEventListener('keyup', keyup)
    window.addEventListener('blur', blur)
    const text = (str: string, px: number, py: number, size = 22) => { ctx.font = `${size}px monospace`; ctx.fillStyle = '#d9f9b9'; ctx.textAlign = 'center'; ctx.fillText(str, px, py) }
    const draw = (now: number) => {
      const dt = last ? Math.min((now-last)/1000, 0.05) : 0; last = now
      ctx.fillStyle = '#08120f'; ctx.fillRect(0,0,640,475)
      text(GAMES.find(g=>g.id===id)!.title.toUpperCase(),320,38)
      if (playing && !over) {
        if (id === 'rally') {
          const pad = navigator.getGamepads?.().find(p => p)
          const stick = pad && Math.abs(pad.axes[1] ?? 0) > 0.15 ? pad.axes[1] : 0
          paddle = Math.max(85, Math.min(415, paddle + ((keys.has('KeyS') || keys.has('ArrowDown') ? 1 : 0) - (keys.has('KeyW') || keys.has('ArrowUp') ? 1 : 0) + stick) * dt * 300))
          cpu += Math.max(-160*dt, Math.min(160*dt, y-cpu)); cpu = Math.max(85, Math.min(415,cpu))
          x += vx*dt; y += vy*dt
          if (y < 64 || y > 436) { y = Math.max(64,Math.min(436,y)); vy = -vy }
          if (vx < 0 && x < 44 && x > 20 && Math.abs(y-paddle) < 46) { x = 44; vx = Math.min(440,-vx*1.04); vy = (y-paddle)*5 }
          if (vx > 0 && x > 596 && x < 620 && Math.abs(y-cpu) < 46) { x = 596; vx = -Math.min(440,vx*1.04); vy = (y-cpu)*5 }
          if (x < 0 || x > 640) { if (x > 640) score++; else other++; x=320; y=230; vx = score % 2 ? -220 : 220; vy=120; over=score>=7 || other>=7 }
        } else {
          tick += dt
          if (tick > 0.13) {
            tick = 0; direction = pending
            const head = {x:snake[0].x+direction.x,y:snake[0].y+direction.y}
            const eats = head.x===food.x && head.y===food.y
            over = head.x<0 || head.x>=30 || head.y<0 || head.y>=18 || snake.slice(0,eats ? undefined : -1).some(p=>p.x===head.x && p.y===head.y)
            if (!over) {
              snake.unshift(head)
              if (!eats) snake.pop()
              else { score++; const empty = []; for(let fy=0;fy<18;fy++) for(let fx=0;fx<30;fx++) if(!snake.some(p=>p.x===fx&&p.y===fy)) empty.push({x:fx,y:fy}); if(!empty.length) over=true; else food=empty[Math.floor(Math.random()*empty.length)] }
            }
          }
        }
      }
      ctx.fillStyle = '#b9eaa0'
      if (id === 'rally') {
        ctx.fillRect(28,paddle-40,12,80); ctx.fillRect(600,cpu-40,12,80); ctx.fillRect(x-6,y-6,12,12)
        ctx.setLineDash([8,12]); ctx.strokeStyle='#446249'; ctx.beginPath(); ctx.moveTo(320,60); ctx.lineTo(320,440); ctx.stroke(); ctx.setLineDash([])
        text(`${score}   ${other}`,320,85,28)
      } else {
        ctx.strokeStyle='#446249'; ctx.strokeRect(19,69,602,362)
        snake.forEach(p=>ctx.fillRect(20+p.x*20,70+p.y*20,18,18))
        ctx.fillStyle='#e4ad70'; ctx.fillRect(20+food.x*20,70+food.y*20,18,18)
        text(`SCORE ${score}`,320,60,16)
      }
      if (over || !playing) { ctx.fillStyle='#08120fe8'; ctx.fillRect(80,175,480,110); text(over ? 'ROUND OVER' : 'PAUSED',320,215,30); text(over ? 'SPACE TO PLAY AGAIN' : 'USE THE REMOTE TO PLAY',320,255,18) }
      text('WASD / ARROWS · SPACE RESTART · ESC EXIT',320,463,15)
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('keydown',keydown); window.removeEventListener('keyup',keyup); window.removeEventListener('blur',blur) }
  }, [id, playing])
  return <canvas ref={canvas} width={640} height={475} style={{width:'100%',height:'100%'}} />
}
