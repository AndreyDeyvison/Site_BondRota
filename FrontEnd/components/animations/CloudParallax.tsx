'use client';

import { useState, useEffect, useCallback } from 'react';

interface CloudImageProps {
  width: number | string;
  height: number | string;
  opacity: number;
}

const CloudSVG = ({ width, height, opacity }: CloudImageProps) => (
  <img 
    src="/images/nuvemFundo.png" 
    alt="Nuvem de fundo"
    style={{ 
      width: width, 
      height: height, 
      opacity: opacity,
      objectFit: 'contain'
    }} 
  />
);

interface CloudLayer {
  id: number;
  Component: React.FC<{ opacity: number; color: string; width: number; height: number }>;
  isMountain?: boolean;
  speedX: number;
  speedY: number;
  top: string;
  left: string;
  color: string;
  opacity: number;
  width: number;
  height: number;
  zIndex: number;
}

const cloudLayers: CloudLayer[] = [
  {
    id: 3,
    Component: CloudSVG,
    speedX: 1.4,
    speedY: 0.22,
    top: '10%',
    left: '45%',
    color: '#6A7EAA',
    opacity: 0.55,
    width: 180,
    height: 60,
    zIndex: 3,
  },
  {
    id: 4,
    Component: CloudSVG,
    speedX: 2.2,
    speedY: 0.38,
    top: '40%',
    left: '7%',
    color: '#8A9ECA',
    opacity: 0.65,
    width: 200,
    height: 90,
    zIndex: 4,
  },
  {
    id: 5,
    Component: CloudSVG,
    speedX: 2.2,
    speedY: 0.38,
    top: '50%',
    left: '70%',
    color: '#8A9ECA',
    opacity: 0.65,
    width: 200,
    height: 90,
    zIndex: 4,
  },
];

export default function CloudParallax() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    setMousePos({
      x: (e.clientX - centerX) / centerX,
      y: (e.clientY - centerY) / centerY,
    });
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [handleMouseMove]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      
      {/* Estilo CSS injetado para a animação de vibração do motor do ônibus */}
      <style>{`
          @keyframes vibrarEEspelhar {
          0% { transform: scaleX(-1) translateY(0); }
          25% { transform: scaleX(-1) translateY(-0.8px); }
          50% { transform: scaleX(-1) translateY(0); }
          75% { transform: scaleX(-1) translateY(0.6px); }
          100% { transform: scaleX(-1) translateY(0); }
        }
        .onibus-ligado-espelhado {
          animation: vibrarEEspelhar 0.12s linear infinite;
        }
      `}</style>

      {/* =========================================================================
          NUVENS FLUTUANTES INDIVIDUAIS (BACKGROUND)
         ========================================================================= */}
      {cloudLayers.map((layer) => (
        <div
          key={layer.id}
          className="absolute"
          style={{
            top: layer.top,
            left: layer.left,
            zIndex: layer.zIndex,
            transform: `translate(${mousePos.x * -layer.speedX * 20}px, ${mousePos.y * layer.speedY * 20}px)`,
            transition: 'transform 0.2s ease-out',
          }}
        >
          <layer.Component
            opacity={layer.opacity}
            color={layer.color}
            width={layer.width}
            height={layer.height}
          />
        </div>
      ))}

      {/* =========================================================================
          AS 3 CAMADAS INFERIORES COM PARALLAX
         ========================================================================= */}

      {/* TERCEIRA CAMADA (Fundo) */}
      <div
        className="absolute bottom-[-5px] left-[-3%] w-[106%]"
        style={{
          zIndex: 8,
          transform: `translate(${mousePos.x * -10}px, ${mousePos.y * 5}px)`,
          transition: 'transform 0.22s ease-out',
        }}
      >
        <img 
          src="/images/camadas/terceiraCamada.png" 
          alt="Nuvens base terceira camada"
          className="w-full h-auto"
          style={{ 
            aspectRatio: '1279/302',
            objectFit: 'cover',
            objectPosition: 'bottom',
            filter: 'brightness(0.3) contrast(1.3) saturate(0.5)',
            opacity: 0.25
          }}
        />
      </div>

      {/* SEGUNDA CAMADA (Meio) */}
      <div
        className="absolute bottom-[-10px] left-[-4vw] w-[60vw]"
        style={{
          zIndex: 9,
          transform: `translate(${mousePos.x * -18}px, ${mousePos.y * 10}px)`,
          transition: 'transform 0.18s ease-out',
        }}
      >
        <img 
          src="/images/camadas/segundaCamada.png" 
          alt="Nuvens base segunda camada"
          className="w-full h-auto"
          style={{ 
            aspectRatio: '829/233',
            objectFit: 'cover',
            objectPosition: 'left bottom',
            filter: 'brightness(0.45) contrast(1.2) saturate(0.7) hue-rotate(10deg)',
            opacity: 0.6
          }}
        />
      </div>

      {/* PRIMEIRA CAMADA (Frente) */}
      <div
        className="absolute bottom-[-15px] right-[-4vw] w-[70vw]"
        style={{
          zIndex: 10,
          transform: `translate(${mousePos.x * -25}px, ${mousePos.y * 15}px)`,
          transition: 'transform 0.15s ease-out',
        }}
      >
        <img 
          src="/images/camadas/primeiraCamada.png" 
          alt="Nuvens base primeira camada"
          className="w-full h-auto"
          style={{ 
            aspectRatio: '899/237',
            objectFit: 'cover',
            objectPosition: 'right bottom',
            filter: 'brightness(0.75) contrast(1.1) hue-rotate(15deg)',
            opacity: 1
          }}
        />
      </div>

      {/* =========================================================================
          PLATAFORMA FIXA DO ÔNIBUS (Z-INDEX 20)
         ========================================================================= */}
      <div 
        className="absolute bottom-0 left-0 w-full h-[4vh]" 
        style={{
          zIndex: 20,
          backgroundColor: '#ffffff',
          filter: 'brightness(0.75) contrast(1.1) hue-rotate(15deg)',
          opacity: 1,
        }}
      >
        {/* Imagem do Ônibus - Aumentado e com classe de animação aplicada */}
        <img 
          src="/images/onibus.png" 
          alt="Ônibus" 
          className="absolute left-[25%] h-[450%]  onibus-ligado-espelhado" 
          style={{
            bottom: '100%', // Reajustado para que as rodas fiquem coladas na plataforma mesmo maior
            objectFit: 'contain',
            filter: 'brightness(1) contrast(1.05)' 
          }}
        />
      </div>

    </div>
  );
}