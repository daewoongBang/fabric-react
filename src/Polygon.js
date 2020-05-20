import React, { useState, useEffect, useRef, useCallback } from 'react';
import { fabric } from 'fabric';

const Polygon = () => {
  const canvasEl = useRef();
  const [canvas, setCanvas] = useState();
  const [lines, setLines] = useState([]);
  const [circles, setCircles] = useState([]);
  const [editPolygon, setEditPolygon] = useState(null);
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
    const activePolygon = canvas.getActiveObject();
    window.console.log('Edit', activePolygon);
    // const indexPolygon = canvas.getObjects().indexOf(activePolygon);

    if (editPolygon) {
      editPolygon.cornerStyle = 'rect';
      editPolygon.controls = fabric.Object.prototype.controls;
      circles.forEach(value => {
        canvas.remove(value);
      });
      editPolygon.hasBorders = !editPolygon.edit;
    }

    if (activePolygon) {
      canvas.setActiveObject(activePolygon);
      activePolygon.edit = !activePolygon.edit;

      if (activePolygon.edit) {
        const lastControl = activePolygon.points.length - 1;
        activePolygon.cornerStyle = 'circle';
        activePolygon.hasControls = false;

        // 3.6.3 version
        makeCircles(activePolygon.points);
        setEditPolygon(activePolygon);
        // 4.0.0 version
        // activePolygon.controls = activePolygon.points.reduce(
        //   (acc, point, index) => {
        //     acc['p' + index] = new fabric({
        //       positionHandler: polygonPositionHandler,
        //       actionHandler: anchorWrapper(
        //         index > 0 ? index - 1 : lastControl,
        //         actionHandler
        //       ),
        //       actionName: 'modifyPoligon',
        //       pointIndex: index
        //     });
        //     return acc;
        //   },
        //   {}
        // );
      } else {
        activePolygon.cornerStyle = 'rect';
        activePolygon.controls = fabric.Object.prototype.controls;

        circles.forEach(value => {
          canvas.remove(value);
        });
        setCircles([]);
        setEditPolygon(null);
      }
      activePolygon.hasBorders = !activePolygon.edit;
      canvas.requestRenderAll();

      window.console.log(activePolygon);
    }

    // eslint-disable-next-line
  }, [canvas, circles, editPolygon]);

  const handleClearButtonClick = useCallback(() => {
    canvas.clear();
  }, [canvas]);

  const polygonPositionHandler = (dim, finalMatrix, fabricObject) => {
    const x =
        fabricObject.points[this.pointIndex].x - fabricObject.pathOffset.x,
      y = fabricObject.points[this.pointIndex].y - fabricObject.pathOffset.y;
    return fabric.util.transformPoint(
      { x: x, y: y },
      fabricObject.calcTransformMatrix()
    );
  };

  const actionHandler = (eventData, transform, x, y) => {
    const polygon = transform.target,
      currentControl = polygon.controls[polygon.__corner],
      mouseLocalPosition = polygon.toLocalPoint(
        new fabric.Point(x, y),
        'center',
        'center'
      ),
      size = polygon._getTransformedDimensions(0, 0),
      finalPointPosition = {
        x:
          (mouseLocalPosition.x * polygon.width) / size.x +
          polygon.pathOffset.x,
        y:
          (mouseLocalPosition.y * polygon.height) / size.y +
          polygon.pathOffset.y
      };
    polygon.points[currentControl.pointIndex] = finalPointPosition;
    return true;
  };

  const anchorWrapper = (anchorIndex, fn) => {
    return function (eventData, transform, x, y) {
      const fabricObject = transform.target,
        absolutePoint = fabric.util.transformPoint(
          {
            x: fabricObject.points[anchorIndex].x - fabricObject.pathOffset.x,
            y: fabricObject.points[anchorIndex].y - fabricObject.pathOffset.y
          },
          fabricObject.calcTransformMatrix()
        );
      const actionPerformed = fn(eventData, transform, x, y);
      const newDim = fabricObject._setPositionDimensions({});
      const newX =
          (fabricObject.points[anchorIndex].x - fabricObject.pathOffset.x) /
          fabricObject.width,
        newY =
          (fabricObject.points[anchorIndex].y - fabricObject.pathOffset.y) /
          fabricObject.height;
      fabricObject.setPositionByOrigin(absolutePoint, newX + 0.5, newY + 0.5);
      return actionPerformed;
    };
  };

  const handleMouseUp = useCallback(
    options => {
      if (drawingObject.type === 'polygon') {
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

  const handleObjectMoving = useCallback(
    options => {
      window.console.log('moving');
      if (editPolygon) {
        const objectType = options.target.get('type');
        const p = options.target;
        if (objectType === 'circle') {
          window.console.log('objectType', objectType);
          window.console.log('p', p);

          editPolygon.points[p.name] = {
            x: p.getCenterPoint().x,
            y: p.getCenterPoint().y
          };
          editPolygon.initialize(editPolygon.points);
        }
        window.console.log(editPolygon.points);

        //   window.console.log('수정 중 이동!');
        //   circles.forEach(value => {
        //     canvas.remove(value);
        //   });
        //   //   window.console.log(getActivePolygonPoints());
        //   makeCircles(getActivePolygonPoints());
        //   canvas.requestRenderAll();
      }
      // eslint-disable-next-line
    },
    // eslint-disable-next-line
    [canvas, editPolygon]
  );

  const handleObjectMoved = useCallback(
    options => {
      const activePolygon = canvas.getActiveObject();
      //   window.console.log('수정된 activePolygon', activePolygon);
      //   activePolygon.set({ points: points });
      //   window.console.log('수정된 activePolygon', activePolygon);
      //   const aa = makePolygon(points);
      //   canvas.add(aa);
      //   canvas.renderAll();
      if (options.target.get('type') === 'polygon') {
        activePolygon.initialize(getActivePolygonPoints());
        if (editPolygon) {
          circles.forEach(value => {
            canvas.remove(value);
          });
          makeCircles(getActivePolygonPoints());
          canvas.requestRenderAll();
        }
      }

      //   window.console.log(circles);

      window.console.log('activePolygon', activePolygon);
      // activePolygon.points = points;

      // points.forEach((point, index) => {
      //   //   window.console.log('point', point);
      //   const circle = new fabric.Circle({
      //     radius: 5,
      //     fill: 'green',
      //     left: point.x,
      //     top: point.y,
      //     originX: 'center',
      //     originY: 'center',
      //     hasBorders: false,
      //     hasControls: false
      //     //   name: `${indexPolygon}-${index}`
      //   });
      //   // tempCircles = tempCircles.concat(circle);
      //   //   canvas.add(circle);
      // });

      // // const polygon = makePolygon(points);
      // // canvas.add(polygon);
      // // // canvas.remove(activePolygon);
      // // canvas.renderAll();

      //   window.console.log('e', e.target);
      //   window.console.log('points', points);
    },
    // eslint-disable-next-line
    [canvas, circles]
  );

  const makePolygon = useCallback(
    points => {
      const polygon = new fabric.Polygon(points, {
        left: getLeftPosition(polygonPoints),
        top: getTopPosition(polygonPoints),
        fill: 'rgba(0, 255, 0, 0.1)',
        // stroke: 'rgba(0, 255, 0, 0.5)',
        // strokeWidth: 2,
        // hasBorders: false,
        hasControls: false
        // evented: false
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
          name: index
        });
        tempCircles = tempCircles.concat(circle);
        canvas.add(circle);
      });
      window.console.log('tempCircles', tempCircles);
      setCircles(tempCircles);
    },
    // eslint-disable-next-line
    [canvas]
  );

  const getActivePolygonPoints = useCallback(() => {
    const activePolygon = canvas.getActiveObject();

    const matrix = activePolygon.calcTransformMatrix();
    const points = activePolygon
      .get('points')
      .map(p => {
        return new fabric.Point(
          p.x - activePolygon.pathOffset.x,
          p.y - activePolygon.pathOffset.y
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

  //   const getRandomRGB = opacity => {
  //     const o = Math.round,
  //       r = Math.random,
  //       s = 255;

  //     return (
  //       'rgba(' +
  //       o(r() * s) +
  //       ',' +
  //       o(r() * s) +
  //       ',' +
  //       o(r() * s) +
  //       ',' +
  //       opacity +
  //       ')'
  //     );
  //   };

  useEffect(() => {
    if (canvas) {
      canvas.off('mouse:up');
      canvas.off('mouse:move');
      canvas.off('mouse:dblclick');
      canvas.off('object:moved');
      canvas.off('object:moving');

      canvas.on('mouse:up', handleMouseUp);
      canvas.on('mouse:move', handleMouseMove);
      canvas.on('mouse:dblclick', handleMouseDoubleClick);
      canvas.on('object:moving', handleObjectMoving);
      canvas.on('object:moved', handleObjectMoved);
    }

    // eslint-disable-next-line
  }, [canvas, drawingObject, polygonPoints, lines, circles, lineCount]);

  useEffect(() => {
    if (canvas) {
      setCanvas(canvas);
    } else {
      const fabricCanvas = new fabric.Canvas(canvasEl.current, {
        // selection: false
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
