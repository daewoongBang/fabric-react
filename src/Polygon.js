import React, { useState, useEffect, useRef, useCallback } from 'react';
import { fabric } from 'fabric';

const Polygon = () => {
  const canvasEl = useRef();
  const [canvas, setCanvas] = useState();
  const [lines, setLines] = useState([]);
  const [circles, setCircles] = useState([]);

  const [lineCount, setLineCount] = useState(0);
  const [polygonPoints, setpolygonPoints] = useState([]);
  const [drawingObject, setDrawingObject] = useState({
    type: '',
    background: '',
    border: ''
  });

  const handleDrawPolygonButtonClick = () => {
    if (drawingObject.type === 'polygon') {
      setDrawingObject({ ...drawingObject, type: '' });
    } else {
      setDrawingObject({ ...drawingObject, type: 'polygon' });
    }
  };

  const handleEditPolygonButtonClick = useCallback(() => {
    const activePolygon = findPolygon();

    if (activePolygon) {
      // canvas.setActiveObject(activePolygon);
      activePolygon.edit = !activePolygon.edit;

      if (activePolygon.edit) {
        activePolygon.cornerStyle = 'circle';
        activePolygon.hasControls = false;

        makeCircles(activePolygon.points);
      } else {
        activePolygon.cornerStyle = 'rect';
        activePolygon.controls = fabric.Object.prototype.controls;

        circles.forEach(value => {
          canvas.remove(value);
        });
        setCircles([]);
      }
      //   activePolygon.hasBorders = !activePolygon.edit;
      canvas.requestRenderAll();
    }

    // eslint-disable-next-line
  }, [canvas, circles]);

  const handleClearButtonClick = useCallback(() => {
    canvas.clear();
  }, [canvas]);

  const handleMouseUp = useCallback(
    options => {
      if (drawingObject.type === 'polygon') {
        window.console.log('handleMouseUp!!!!!!!!!');
        const x = options.pointer.x;
        const y = options.pointer.y;

        setpolygonPoints(
          polygonPoints.concat({
            x: x,
            y: y
          })
        );

        const points = [x, y, x, y];
        const line = new fabric.Line(points, {
          strokeWidth: 2,
          selectable: false,
          stroke: 'rgba(0, 255, 0, 0.5)'
        });

        setLines(lines.concat(line));
        setLineCount(lineCount + 1);
        canvas.add(line);
      }
    },
    // eslint-disable-next-line
    [canvas, drawingObject, polygonPoints, lines, lineCount]
  );

  const handleMouseDown = useCallback(
    options => {
      const activePolygon = canvas.getActiveObject();

      if (
        activePolygon &&
        activePolygon.get('type') === 'polygon' &&
        activePolygon.edit
      ) {
        circles.forEach(value => {
          canvas.remove(value);
        });
      }
    },
    [canvas, circles]
  );

  const handleMouseMove = useCallback(
    options => {
      if (lines[0] && drawingObject.type === 'polygon') {
        lines[lineCount - 1].set({
          x2: options.pointer.x,
          y2: options.pointer.y
        });
        canvas.renderAll();
      }
    },
    // eslint-disable-next-line
    [canvas, drawingObject, lines, lineCount]
  );

  const handleObjectMoved = useCallback(
    options => {
      window.console.log('handleObjectMoved');
    },
    // eslint-disable-next-line
    [canvas]
  );

  const handleObjectMoving = useCallback(
    options => {
      // polygon 이동과 circle 이동 구분
      // const activePolygon = canvas.getActiveObject();
      // const activePolygon = findPolygon();

      //   window.console.log('activePolygon', activePolygon.get('type'));
      //   window.console.log('options', options.target.get('type'));
      if (options.target.get('type') === 'circle') {
        // const polygon = canvas.getObjects()[0];
        const polygon = findPolygon();
        const circle = options.target;

        polygon.points[circle.name] = {
          x: circle.getCenterPoint().x,
          y: circle.getCenterPoint().y
        };
      }
    },
    // eslint-disable-next-line
    [canvas]
  );

  const handleMouseDoubleClick = useCallback(() => {
    if (drawingObject.type === 'polygon') {
      setDrawingObject({ ...drawingObject, type: '' });

      lines.forEach(value => {
        canvas.remove(value);
      });

      polygonPoints.splice(polygonPoints.length - 1);
      const polygon = makePolygon(polygonPoints);
      canvas.add(polygon);
      canvas.renderAll();

      //clear
      setpolygonPoints([]);
      setLines([]);
      setLineCount(0);
    }

    const activePolygon = canvas.getActiveObject();
    if (activePolygon) {
      window.console.log('dbclick', activePolygon);
    }

    // eslint-disable-next-line
  }, [canvas, drawingObject, lines, polygonPoints]);

  const handleMouseOver = useCallback(
    options => {
      options.target &&
        window.console.log('target', options.target.get('type'));
    },
    // eslint-disable-next-line
    [canvas]
  );

  const handleObjectModified = useCallback(
    options => {
      const activePolygon = findPolygon();
      // const activePolygon2 = canvas.getObjects()[0].toObject();
      const objects = canvas.getObjects();

      if (activePolygon) {
        window.console.log('activePolygon', activePolygon);
        window.console.log('objects', objects);

        const points = getPolygonPoints();
        activePolygon.initialize(points);

        const newPolygon = makePolygon(points);
        newPolygon.left = activePolygon.left;
        newPolygon.top = activePolygon.top;
        newPolygon.edit = activePolygon.edit;

        canvas.forEachObject(object => {
          canvas.remove(object);
        });

        canvas.add(newPolygon);

        if (newPolygon.edit) {
          const points = getPolygonPoints();
          makeCircles(points);
        }

        canvas.renderAll();
      }
    },
    // eslint-disable-next-line
    [canvas]
  );

  const makePolygon = useCallback(
    points => {
      const polygon = new fabric.Polygon(points, {
        left: getLeftPosition(polygonPoints),
        top: getTopPosition(polygonPoints),
        fill: 'rgba(0, 255, 0, 0.1)',
        // stroke: 'rgba(0, 255, 0, 0.5)',
        // strokeWidth: 2,
        hasBorders: false,
        hasControls: false,
        objectCaching: false,
        selection: false,
        // selectable: false
        // evented: false,
        index: 0
      });

      return polygon;
    },
    // eslint-disable-next-line
    [canvas, polygonPoints]
  );

  const makeCircles = useCallback(
    points => {
      let tempCircles = [];
      points.forEach((point, index) => {
        const circle = new fabric.Circle({
          radius: 5,
          fill: 'rgba(0, 255, 0, 0.8)',
          left: point.x,
          top: point.y,
          originX: 'center',
          originY: 'center',
          hasBorders: false,
          hasControls: false,
          selection: false,
          name: index,
          index: index,
          hoverCursor: 'pointer'
        });
        tempCircles = tempCircles.concat(circle);
        canvas.add(circle);
      });
      setCircles(tempCircles);
    },
    // eslint-disable-next-line
    [canvas]
  );

  const findPolygon = useCallback(() => {
    let polygon = null;

    canvas.forEachObject(object => {
      if (object.get('type') === 'polygon') {
        polygon = object;
      }
    });

    return polygon;

    // eslint-disable-next-line
  }, [canvas, circles]);

  const getPolygonPoints = useCallback(() => {
    const polygon = findPolygon();

    const matrix = polygon.calcTransformMatrix();
    const points = polygon
      .get('points')
      .map(p => {
        return new fabric.Point(
          p.x - polygon.pathOffset.x,
          p.y - polygon.pathOffset.y
        );
      })
      .map(p => {
        return fabric.util.transformPoint(p, matrix);
      });

    return points;
    // eslint-disable-next-line
  }, [canvas]);

  const getTopPosition = useCallback(
    points => {
      let result = canvas.height;

      for (let i = 0; i < lineCount; i++) {
        if (points[i].y < result) {
          result = points[i].y;
        }
      }
      return Math.abs(result);
    },
    [canvas, lineCount]
  );

  const getLeftPosition = useCallback(
    points => {
      let result = canvas.width;
      for (let i = 0; i < lineCount; i++) {
        if (points[i].x < result) {
          result = points[i].x;
        }
      }
      return Math.abs(result);
    },
    [canvas, lineCount]
  );

  useEffect(() => {
    if (canvas) {
      canvas.off('mouse:up');
      canvas.off('mouse:down');
      canvas.off('mouse:move');
      canvas.off('mouse:dblclick');
      canvas.off('object:moved');
      canvas.off('object:moving');
      canvas.off('object:modified');
      canvas.off('mouse:over');

      canvas.on('mouse:up', handleMouseUp);
      canvas.on('mouse:down', handleMouseDown);
      canvas.on('mouse:move', handleMouseMove);
      canvas.on('mouse:dblclick', handleMouseDoubleClick);
      canvas.on('object:moving', handleObjectMoving);
      canvas.on('object:moved', handleObjectMoved);
      canvas.on('object:modified', handleObjectModified);
      canvas.on('mouse:over', handleMouseOver);
    }

    // eslint-disable-next-line
  }, [canvas, drawingObject, polygonPoints, lines, circles, lineCount]);

  useEffect(() => {
    if (canvas) {
      setCanvas(canvas);
    } else {
      const fabricCanvas = new fabric.Canvas(canvasEl.current, {
        selection: false
      });

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
        <button
          onClick={handleDrawPolygonButtonClick}
          disabled={drawingObject.type !== ''}
        >
          Draw Polygon
        </button>
        <button
          onClick={handleEditPolygonButtonClick}
          disabled={drawingObject.type !== ''}
        >
          Edit Polygon
        </button>
        <button
          onClick={handleClearButtonClick}
          disabled={drawingObject.type !== ''}
        >
          clear
        </button>

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
