import React, { useState, useEffect, useRef } from 'react';
import { fabric } from 'fabric';

const Fabric = () => {
  const canvasEl = useRef();
  const [canvas, setCanvas] = useState();

  const [isEnd, setEnd] = useState(true);
  const [moveXY, setMoveXY] = useState({ x: 0, y: 0 });
  const [lineXY, setLineXY] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (canvas) {
      window.console.log('canvas', canvas);
    } else {
      const fabricState = new fabric.Canvas(canvasEl.current, {});
      fabricState
        .setWidth(300)
        .setHeight(300)
        .setBackgroundColor('#ffffff')
        .renderAll();

      fabricState.on('mouse:up', e => {
        window.console.log('mouse-up', e);
        window.console.log('mouse-x', e.pointer.x);
        window.console.log('mouse-y', e.pointer.y);
        if (isEnd) {
          setMoveXY({ x: e.pointer.x, y: e.pointer.y });
          setEnd(false);
        } else {
          setEnd(false);
        }
      });

      //   const path = new fabric.Path('M 0 0 L 200 100 L 170 200 z');
      //   path.set({ left: 120, top: 120 });
      //   const rect = new fabric.Rect();
      //   fabricState.add(path);

      setCanvas(canvas);
      window.console.log('canvas2', fabricState);
    }
    window.console.log('fabric', fabric);
  }, [canvas, isEnd]);
  return (
    <div>
      <p>Fabric</p>
      <canvas
        ref={canvasEl}
        style={{
          border: '1px solid black'
        }}
      ></canvas>
    </div>
  );
};

export default Fabric;
