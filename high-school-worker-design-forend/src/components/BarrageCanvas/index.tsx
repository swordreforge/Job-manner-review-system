import { useRef, useEffect, useCallback } from 'react';

interface CommentItem {
  id: number;
  user: string;
  avatar: string;
  text: string;
  color: string;
}

interface BarrageCanvasProps {
  comments: CommentItem[];
  trackCount?: number;
  trackHeight?: number;
  speed?: number;
  spawnInterval?: number;
}

interface BarrageItem {
  id: number;
  comment: CommentItem;
  x: number;
  track: number;
  width: number;
  active: boolean;
}

function shuffleArray<T>(items: T[]): T[] {
  const cloned = [...items];
  for (let i = cloned.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cloned[i], cloned[j]] = [cloned[j], cloned[i]];
  }
  return cloned;
}

export default function BarrageCanvas({
  comments,
  trackCount = 8,
  trackHeight = 48,
  speed = 120,
  spawnInterval = 400,
}: BarrageCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);
  const lastSpawnRef = useRef<number>(0);
  const lastFrameRef = useRef<number>(0);
  const queueRef = useRef<number[]>([]);
  const occupiedTracksRef = useRef<Set<number>>(new Set());
  const poolRef = useRef<BarrageItem[]>([]);
  const activeRef = useRef<BarrageItem[]>([]);

  const drawBarrage = useCallback((ctx: CanvasRenderingContext2D, item: BarrageItem, th: number) => {
    const { comment, x, track, width } = item;
    const y = track * th + 4;
    const h = 40;
    const padding = 12;
    const radius = 20;
    
    ctx.fillStyle = `${comment.color}20`;
    ctx.strokeStyle = `${comment.color}40`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x, y, width, h, radius);
    ctx.fill();
    ctx.stroke();
    
    ctx.font = '19px serif';
    ctx.fillText(comment.avatar, x + padding, y + 26);
    
    ctx.font = '500 14px system-ui, sans-serif';
    ctx.fillStyle = comment.color;
    const username = `${comment.user}:`;
    const usernameWidth = ctx.measureText(username).width;
    ctx.fillText(username, x + padding + 24, y + 26);
    
    const textX = x + padding + 28 + usernameWidth;
    ctx.fillStyle = '#d1d5db';
    ctx.font = '14px system-ui, sans-serif';
    ctx.fillText(comment.text, textX, y + 26);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    
    const spawnBarrageToTrack = (containerWidth: number, tracks: number[], startX?: number) => {
      if (document.hidden) return;
      if (tracks.length === 0) return;
      
      if (queueRef.current.length === 0) {
        queueRef.current = shuffleArray(comments.map((item) => item.id));
      }
      
      const nextId = queueRef.current.shift();
      if (nextId === undefined) return;
      
      const comment = comments.find((c) => c.id === nextId);
      if (!comment) return;
      
      const track = tracks[0];
      const xOffset = startX !== undefined ? startX : Math.random() * containerWidth * 0.3;
      
      let item = poolRef.current.pop();
      if (!item) {
        item = {
          id: Date.now(),
          comment,
          x: containerWidth + xOffset,
          track,
          width: 0,
          active: true,
        };
      } else {
        item.id = Date.now();
        item.comment = comment;
        item.x = containerWidth + xOffset;
        item.track = track;
        item.active = true;
      }
      
      ctx.font = '500 14px system-ui, sans-serif';
      const usernameWidth = ctx.measureText(`${comment.user}:`).width;
      ctx.font = '14px system-ui, sans-serif';
      const textWidth = ctx.measureText(comment.text).width;
      
      item.width = Math.ceil(12 + 23 + usernameWidth + 4 + textWidth + 12);
      
      occupiedTracksRef.current.add(track);
      activeRef.current.push(item);
    };
    
    const spawnBarrage = (containerWidth: number, initMode = false) => {
      if (document.hidden) return;
      
      const availableTracks = Array.from({ length: trackCount }, (_, i) => i)
        .filter((track) => !occupiedTracksRef.current.has(track));
      
      if (availableTracks.length === 0) return;
      
      const track = availableTracks[Math.floor(Math.random() * availableTracks.length)];
      const startX = initMode ? Math.random() * containerWidth : undefined;
      spawnBarrageToTrack(containerWidth, [track], startX);
    };
    
    const initBarrages = (containerWidth: number) => {
      for (let i = 0; i < trackCount; i++) {
        spawnBarrage(containerWidth, true);
      }
    };
    
    initBarrages(canvas.width);
    
    const animate = (timestamp: number) => {
      const containerWidth = canvas.width;
      
      const deltaTime = lastFrameRef.current ? (timestamp - lastFrameRef.current) / 1000 : 1 / 60;
      lastFrameRef.current = timestamp;
      const clampedDelta = Math.min(deltaTime, 1 / 30);
      
      ctx.clearRect(0, 0, containerWidth, canvas.height);
      
      for (let i = activeRef.current.length - 1; i >= 0; i--) {
        const item = activeRef.current[i];
        if (!item.active) continue;
        
        item.x -= speed * clampedDelta;
        drawBarrage(ctx, item, trackHeight);
        
        if (item.x + item.width < 0) {
          activeRef.current.splice(i, 1);
          item.active = false;
          poolRef.current.push(item);
          occupiedTracksRef.current.delete(item.track);
          spawnBarrage(containerWidth);
        } else if (item.x < containerWidth * 0.5) {
          const allTracks = Array.from({ length: trackCount }, (_, i) => i);
          const availableTracks = allTracks.filter(t => !occupiedTracksRef.current.has(t));
          if (availableTracks.length > 0) {
            spawnBarrageToTrack(containerWidth, availableTracks);
          }
        }
      }
      
      if (timestamp - lastSpawnRef.current >= spawnInterval) {
        spawnBarrage(containerWidth);
        lastSpawnRef.current = timestamp;
      }
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      window.removeEventListener('resize', updateSize);
      cancelAnimationFrame(animationRef.current);
    };
  }, [comments, speed, spawnInterval, trackCount, trackHeight, drawBarrage]);

  return (
    <div ref={containerRef} className="absolute inset-0">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
}
