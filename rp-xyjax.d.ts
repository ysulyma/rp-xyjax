export function extendXY(): void;

export function xyEncodeColor(color: string): string;

export function xyDecodeColor(color: string): string;

export function tob52(str: string): string;

export function fromb52(str: string): string;

import type {MJX} from "rp-mathjax";
import type {Utils} from "ractive-player";

interface Opts extends Omit<Parameters<typeof Utils.animation.animate>[0], "startTime"> {
  startTime: number | string;
}

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

export function lerp(a: number, b: number, t: number): number;

export function a$opacity(u: number, nodes: SVGElement[]): void;

export function useAnimateArrows(o: Options, deps?: React.DependencyList): void;

interface UseMathAnimationOptions {
  ref: React.MutableRefObject<MJX>;
  selector: string;
  fn: (t: number) => number;
  cb: (u: number, nodes: SVGElement[]) => void;
}

export function useMathAnimation(o: UseMathAnimationOptions, deps?: React.DependencyList): void;

export function useAnimation(opts: Opts, cb: (t: number) => void): void;

export function useLazy(anim: (t: number) => number, cb: (t: number) => void, deps?: React.DependencyList): void;
