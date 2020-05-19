import React, { useState, useEffect, useRef, useCallback } from 'react';
import { fabric } from 'fabric';

const Polygon = () => {
  const canvasEl = useRef();
  const [canvas, setCanvas] = useState();
  const [drawingObject, setDrawingObject] = useState({
    type: '',
    background: '',
    border: ''
  });
  const [startingPoint, setStartingPoint] = useState({ x: 0, y: 0 });
  const [polygonPoints, setpolygonPoints] = useState([]);
  const [lines, setLines] = useState([]);
  const [lineCount, setLineCount] = useState(0);

  const handleDrawPolygonClick = () => {
    if (drawingObject.type === 'polygon') {
      setDrawingObject({ ...drawingObject, type: '' });
      // 후처리
    } else {
      setDrawingObject({ ...drawingObject, type: 'polygon' });
    }
  };

  const handleMouseUp = useCallback(
    options => {
      if (drawingObject.type === 'polygon') {
        window.console.log(options);
        setStartingPoint({ x: options.pointer.x, y: options.pointer.y });
        // setStartingPoint(options);
        window.console.log('canvas', canvas);
        const x = options.pointer.x;
        const y = options.pointer.y;
        setpolygonPoints(
          polygonPoints.concat({
            x: options.pointer.x,
            y: options.pointer.y
          })
        );

        const points = [x, y, x, y];
        const line = new fabric.Line(points, {
          strokeWidth: 2,
          selectable: false,
          stroke: 'black'
        });
        setLines(lines.concat(line));
        setLineCount(lineCount + 1);
        canvas.add(line);
      }
    },
    // eslint-disable-next-line
    [canvas, drawingObject, startingPoint, polygonPoints, lines, lineCount]
  );

  const handleMouseMove = useCallback(
    options => {
      if (
        lines[0] !== null &&
        lines[0] !== undefined &&
        drawingObject.type === 'polygon'
      ) {
        setStartingPoint({ x: options.pointer.x, y: options.pointer.y });
        lines[lineCount - 1].set({
          x2: options.pointer.x,
          y2: options.pointer.y
        });
        canvas.renderAll();
      }
    },
    // eslint-disable-next-line
    [canvas, drawingObject, lines, startingPoint, lineCount]
  );

  const handleMouseDoubleClick = useCallback(() => {
    window.console.log('double click!!');

    if (drawingObject.type === 'polygon') {
      setDrawingObject({ ...drawingObject, type: '' });

      lines.forEach(value => {
        canvas.remove(value);
      });

      const polygon = makePolygon(polygonPoints);
      canvas.add(polygon);
      canvas.renderAll();

      //clear arrays
      setpolygonPoints([]);
      setLines([]);
      setLineCount(0);
    }

    // eslint-disable-next-line
  }, [canvas, drawingObject, lines, polygonPoints]);

  const makePolygon = useCallback(
    points => {
      const polygon = new fabric.Polygon(points, {
        left: findLeftPaddingForPolygon(polygonPoints),
        top: findTopPaddingForPolygon(polygonPoints),
        fill: 'rgba(0,255,0,0.1)',
        stroke: 'black',
        strokeWidth: 2
      });

      return polygon;
    },
    // eslint-disable-next-line
    [canvas, polygonPoints]
  );

  const findTopPaddingForPolygon = useCallback(
    points => {
      let result = 999999;
      for (var f = 0; f < lineCount; f++) {
        if (points[f].y < result) {
          result = points[f].y;
        }
      }
      return Math.abs(result);
    },
    [lineCount]
  );

  const findLeftPaddingForPolygon = useCallback(
    points => {
      let result = 999999;
      for (var i = 0; i < lineCount; i++) {
        if (points[i].x < result) {
          result = points[i].x;
        }
      }
      return Math.abs(result);
    },
    [lineCount]
  );

  useEffect(() => {
    window.console.log(polygonPoints);
  }, [polygonPoints]);

  useEffect(() => {
    if (canvas) {
      //   canvas.off('mouse:up');

      canvas.off('mouse:up');
      canvas.off('mouse:move');
      canvas.off('mouse:dblclick');

      canvas.on('mouse:up', handleMouseUp);
      canvas.on('mouse:move', handleMouseMove);
      canvas.on('mouse:dblclick', handleMouseDoubleClick);
    }

    // eslint-disable-next-line
  }, [canvas, drawingObject, polygonPoints, startingPoint, lines, lineCount]);

  useEffect(() => {
    if (canvas) {
      setCanvas(canvas);
    } else {
      const fabricCanvas = new fabric.Canvas(canvasEl.current, {});
      fabricCanvas
        .setWidth(500)
        .setHeight(500)
        .setBackgroundColor('#ffffff')
        .renderAll();

      window.console.log('fabricCanvas', fabricCanvas);
      setCanvas(fabricCanvas);
    }
    // eslint-disable-next-line
  }, []);

  return (
    <div>
      <div>
        <button onClick={handleDrawPolygonClick}>Draw Polygon</button>

        <canvas
          ref={canvasEl}
          style={{
            border: '1px solid black'
          }}
        />
      </div>
      <div
        style={{
          marginLeft: '10px'
        }}
      >
        <p>drawingObject type : {drawingObject.type}</p>
      </div>
    </div>
  );
};

export default Polygon;
