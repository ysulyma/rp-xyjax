/**
  XyJax shenanigans
*/

import {MathJaxReady} from "rp-mathjax";

import {useCallback, useEffect, useMemo, useRef} from "react";
import {Utils, usePlayer, useTimeUpdate} from "ractive-player";
const {animate} = Utils.animation;

interface Opts extends Omit<Parameters<typeof animate>[0], "startTime"> {
  startTime: number | string;
}

import type {Playback} from "ractive-player";

import type {MJX} from "rp-mathjax";

interface Coords {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

interface Options {
  head: string;
  tail: string;
  label?: string;
  ref: React.MutableRefObject<MJX>;
  headFn: any;
  tailFn: any;
  labelFn: any;
}

export function lerp(a: number, b: number, t: number) {
  return a + t * (b - a);
}

export function a$opacity(u: number, nodes: SVGElement[]) {
  for (const node of nodes) {
    node.style.opacity = u.toString();
  }
}

export function useAnimateArrows(o: Options, deps?: React.DependencyList) {
  const {playback} = usePlayer();
  const tail = useRef<SVGLineElement>();
  const head = useRef<SVGPathElement[]>([]);
  const label = useRef<SVGElement[]>([]);
  const init = useRef<Coords>({});

  /* fading functions */
  const fadeTail = useCallback((u: number) => {
    if (!tail.current)
      return;

    const {x1, x2, y1, y2} = init.current;

    if (u === 0) {
      tail.current.style.opacity = "0";
    } else {
      tail.current.style.opacity = "1";
      tail.current.setAttribute("x2", lerp(x1, x2, u).toString());
      tail.current.setAttribute("y2", lerp(y1, y2, u).toString());
    }
  }, []);

  /* fix nodes on rerender */
  useEffect(() => {
    const getNodes = () => {
      if (!o.ref.current) {
        return;
      }

      const reAnimate = init.current.hasOwnProperty("y2");

      // tail
      tail.current = o.ref.current.domElement.querySelector(o.tail);

      const x1 = parseFloat(tail.current.getAttribute("x1"));
      const y1 = parseFloat(tail.current.getAttribute("y1"));

      if (reAnimate) {
        init.current.x2 *= parseFloat(tail.current.getAttribute("x1")) / init.current.x1;
        init.current.y2 *= parseFloat(tail.current.getAttribute("y1")) / init.current.y1;
      } else {
        for (const key of ["x2", "y2"]) {
          init.current[key] = parseFloat(tail.current.getAttribute(key));
        }
      }
      init.current.x1 = x1;
      init.current.y1 = y1;

      // re-animate
      if (reAnimate) {
        fadeTail(o.tailFn(playback.currentTime));
      }
    };

    o.ref.current.ready.then(getNodes);
    o.ref.current.hub.on("Rerender", getNodes);

    return () => {
      o.ref.current.hub.off("Rerender", getNodes);
    };
  }, deps);

  useLazy(o.tailFn, fadeTail, deps);

  /* uMA api */
  useMathAnimation({
    ref: o.ref,
    selector: o.head,
    fn: o.headFn,
    cb: a$opacity
  }, deps);

  useMathAnimation({
    ref: o.ref,
    selector: o.label,
    fn: o.labelFn,
    cb: a$opacity
  }, deps);
}

interface UseMathAnimationOptions {
  ref: React.MutableRefObject<MJX>;
  selector: string;
  fn: (t: number) => number;
  cb: (u: number, nodes: SVGElement[]) => void;
}

export function useMathAnimation(o: UseMathAnimationOptions, deps?: React.DependencyList) {
  const {playback} = usePlayer();
  const prev = useRef<number>();
  const nodes = useRef<SVGElement[]>([]);

  useEffect(() => {
    let rerender = false;

    const getNodes = () => {
      if (!o.ref.current) {
        return;
      }

      nodes.current = Array.from(o.ref.current.domElement.querySelectorAll(o.selector));

      if (rerender) {
        o.cb(o.fn(playback.currentTime), nodes.current);
      } else {
        rerender = true;
      }
    };

    o.ref.current.ready.then(getNodes);
    o.ref.current.hub.on("Rerender", getNodes);

    return () => {
      o.ref.current.hub.off("Rerender", getNodes);
    };
  }, deps);

  useTimeUpdate(t => {
    const u = o.fn(t);
    if (prev.current === u)
      return;
    prev.current = u;
    o.cb(u, nodes.current);
  }, deps);
}

/*
  These are probably supposed to be in ractive-player's Utils.animation.
*/
export function useAnimation(opts: Opts, cb: (t: number) => void) {
  const {script} = usePlayer();
  opts.startTime = script.parseStart(opts.startTime) as number;

  const animFn = animate(opts as typeof opts & {startTime: number;});

  useTimeUpdate(t => {
    // XXX do comparison do avoid re-calling
    cb(animFn(t));
  });
}

export function useLazy(anim: (t: number) => number, cb: (t: number) => void, deps?: React.DependencyList) {
  const prev = useRef<number>();

  useTimeUpdate(t => {
    const u = anim(t);
    if (prev.current === u)
      return;
    prev.current = u;
    cb(u);
  }, deps);
}

export function extendXY() {
  MathJaxReady.then(MathJax => {
    MathJax.Hub.Register.StartupHook("Device-Independent Xy-pic Ready", function () {
      const { xypic } = MathJax.Extension, { AST, memoize } = xypic;
      
      // color
      AST.Modifier.Shape.SetColor = AST.Modifier.Subclass({
        preprocess(context, reversedProcessedModifiers) { },
        modifyShape(context, objectShape, restModifiers, color) {
          objectShape = this.proceedModifyShape(context, objectShape, restModifiers);
          return xypic.Shape.ChangeColorShape(xyDecodeColor(color), objectShape);
        }
      });
      xypic.repositories.modifierRepository.put("color", AST.Modifier.Shape.SetColor());

      // data
      xypic.Graphics.SVG.Augment({
        createChangeDataGroup: function(data) {
          return xypic.Graphics.SVG.ChangeDataGroup(this, data)
        }
      });

      xypic.Graphics.SVG.ChangeDataGroup = xypic.Graphics.SVG.Subclass({
        Init: function (parent, data) {
          this.parent = parent;
          this.drawArea = this.parent.createSVGElement("g");
          Object.assign(this.drawArea.dataset, JSON.parse("{" + fromb52(data) + "}"));
          memoize(this, "getOrigin");
        },
        remove: function () {
          this.drawArea.parentNode.removeChild(this.drawArea);
        },
        extendBoundingBox: function (boundingBox) {
          this.parent.extendBoundingBox(boundingBox);
        },
        getOrigin: function () {
          return this.parent.getOrigin();
        }
      });

      xypic.Shape.ChangeDataShape = xypic.Shape.Subclass({
        Init: function (data, shape) {
          this.data = data;
          this.shape = shape;
          memoize(this, "getBoundingBox");
        },
        draw: function (svg) {
          const g = svg.createChangeDataGroup(this.data);
          this.shape.draw(g);
        },
        getBoundingBox: function () {
          return this.shape.getBoundingBox();
        },
        toString: function () {
          return "" + this.shape + ", data:" + this.data;
        }
      });

      AST.Modifier.Shape.SetData = AST.Modifier.Subclass({
        preprocess(context, reversedProcessedModifiers) {},
        modifyShape(context, objectShape, restModifiers, data) {
          objectShape = this.proceedModifyShape(context, objectShape, restModifiers);
          return xypic.Shape.ChangeDataShape(data, objectShape);
        }
      });
      xypic.repositories.modifierRepository.put("data", AST.Modifier.Shape.SetData());

      // register
      AST.Modifier.Shape.Alphabets.Augment({
        preprocess: function (context, reversedProcessedModifiers) {
          if (this.alphabets.startsWith("color")) {
            return xypic.repositories.modifierRepository.get("color").preprocess(context, reversedProcessedModifiers);
          } else if (this.alphabets.startsWith("data")) {
            return xypic.repositories.modifierRepository.get("data").preprocess(context, reversedProcessedModifiers);
          }
          const modifier = xypic.repositories.modifierRepository.get(this.alphabets);
          if (modifier !== undefined) {
            return modifier.preprocess(context, reversedProcessedModifiers);
          }
          else {}
        },
        modifyShape: function (context, objectShape, restModifiers) {
          if (this.alphabets.startsWith("color")) {
            return xypic.repositories.modifierRepository.get("color").modifyShape(context, objectShape, restModifiers, this.alphabets.substr("color".length));
          } else if (this.alphabets.startsWith("data")) {
            return xypic.repositories.modifierRepository.get("data").modifyShape(context, objectShape, restModifiers, this.alphabets.substr("data".length));
          }
          const modifier = xypic.repositories.modifierRepository.get(this.alphabets);
          if (modifier !== undefined) {
            return modifier.modifyShape(context, objectShape, restModifiers);
          }
        }
      });
    });
  });
}

const MAP = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
const to_b58 = function(B,A){let d=[],s="",i,j,c,n;for(i in B){j=0,c=B[i];s+=c||s.length^i?"":1;while(j in d||c){n=d[j];n=n?n*256+c:c;c=n/A.length|0;d[j]=n%A.length;j++}}while(j--)s+=A[d[j]];return s};
const from_b58 = function(S,A){let d=[],b=[],i,j,c,n;for(i in S){j=0,c=A.indexOf(S[i]);if(c<0)return undefined;c||b.length^i?i:b.push(0);while(j in d||c){n=d[j];n=n?n*A.length+c:c;c=n>>8;d[j]=n%256;j++}}while(j--)b.push(d[j]);return new Uint8Array(b)};

export function xyEncodeColor(color: string) {
  return color.toUpperCase().replace(/[#0-9]/g, (char) => {
    if (char === '#')
      return '';
    return String.fromCharCode('G'.charCodeAt(0) + parseInt(char));
  });
}
export function xyDecodeColor(color: string) {
  return '#' + color.replace(/[G-P]/g, (digit) => {
    return (digit.charCodeAt(0) - 'G'.charCodeAt(0)).toString();
  });
}

export function tob52(str: string) {
  const arr = [];
  for (let i = 0; i < str.length; ++i) {
    arr[i] = str.charCodeAt(i);
  }
  return to_b58(new Uint8Array(arr), MAP);
}

export function fromb52(str: string) {
  const arr = from_b58(str, MAP);
  let ret = "";
  for (let i = 0; i < arr.length; ++i) {
    ret += String.fromCharCode(arr[i]);
  }
  return ret;
}
