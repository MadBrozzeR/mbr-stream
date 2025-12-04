export type SVGElementTagName = keyof SVGElementTagNameMap;
export type SVGElementType = SVGElementTagNameMap[SVGElementTagName];
export type SVGElementMap = SVGElementTagNameMap;

type ParamsAsFunc<N extends SVGElementType, I> = (this: SpluxSVG<N>, node: SpluxSVG<N>) => I;
type SvgCreateParams = {
  width: number | string;
  height: number | string;
};

type TagNameExtended<T extends SVGElementTagName> = T | `${T}.${string}`;

const NAMESPACE = 'http://www.w3.org/2000/svg';

export class SpluxSVG<N extends SVGElementType> {
  node: N;

  constructor (node: N) {
    this.node = node;
  }

  static createSvg<I> (params: SvgCreateParams, callback: ParamsAsFunc<SVGSVGElement, I>): I;
  static createSvg (
    params: SvgCreateParams,
    callback?: ParamsAsFunc<SVGSVGElement, void | undefined | null>
  ): SpluxSVG<SVGSVGElement>;
  static createSvg<I> (params: SvgCreateParams, callback?: ParamsAsFunc<SVGSVGElement, I>) {
    const splux = SpluxSVG.create('svg', null).params({
      viewBox: `0 0 ${params.width} ${params.height}`,
      width: params.width.toString(),
      height: params.height.toString(),
    });

    return callback?.call(splux, splux) || splux;
  }

  static create<T extends SVGElementTagName>(tagName: TagNameExtended<T>, parent?: SVGElement | null): SpluxSVG<SVGElementMap[T]>;
  static create<T extends SVGElementTagName>(
    tagName: TagNameExtended<T>,
    parent?: SVGElement | null,
    callback?: ParamsAsFunc<SVGElementMap[T], void>
  ): SpluxSVG<SVGElementMap[T]>;
  static create<T extends SVGElementTagName, I>(
    tagName: TagNameExtended<T>,
    parent: SVGElement | null,
    callback: ParamsAsFunc<SVGElementMap[T], I>
  ): I;
  static create<T extends SVGElementTagName, I> (
    tagName: TagNameExtended<T>,
    parent?: SVGElement | null,
    callback?: ParamsAsFunc<SVGElementMap[T], I>
  ) {
    const [tag, ...classNames] = tagName.split('.');

    if (!tag) {
      throw new Error('Tag name is not set');
    }

    const node = document.createElementNS(NAMESPACE, tag as T);

    if (classNames.length) {
      node.classList = classNames.join(' ');
    }

    const splux = new SpluxSVG(node);

    parent && parent.appendChild(node);

    if (callback) {
      return callback.call(splux, splux) || splux;
    }

    return splux;
  }

  params(params: Record<string, string | number | undefined>) {
    for (const name in params) if (params[name] !== undefined) {
      this.node.setAttribute(name, params[name].toString());
    }

    return this;
  }

  dom<T extends SVGElementTagName, I>(tag: TagNameExtended<T>, callback: ParamsAsFunc<SVGElementMap[T], I>): I;
  dom<T extends SVGElementTagName>(tag: TagNameExtended<T>, callback?: ParamsAsFunc<SVGElementMap[T], void>): SpluxSVG<SVGElementMap[T]>;
  dom<T extends SVGElementTagName, I>(tag: TagNameExtended<T>, callback?: ParamsAsFunc<SVGElementMap[T], I>) {
    return SpluxSVG.create(tag, this.node, callback);
  }
}
