import * as _ from './core.js';

export const Ele = tag => document.createElement(tag);
export const Comment = s => document.createComment(s);
const svg_namespace = 'http://www.w3.org/2000/svg';
export const SVG = tag => document.createElementNS(svg_namespace, tag);

export const to_kebab_case = s =>
  s.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();

export const DROP = Symbol('DROP');

const get_set_sig_fn = set_fn => (el, k, set_listener) =>
  set_listener(v => set_fn(el, k, v));
const get_set_multi_fn = set_fn => {
  const set_sig = get_set_sig_fn(set_fn);
  return [
    set_sig,
    _.R(set_multi => (el, data) => {
      if (typeof data === 'function') data(d => set_multi.f(el, d));
      else {
        Object.entries(data).forEach(([k, v]) =>
          (typeof v === 'function' ? set_sig : set_fn)(el, k, v)
        );
      }
    }),
  ];
};

export const GetStyles = styles =>
  _.ObjectMapEntries(styles, ([k, v]) => [to_kebab_case(k), v]);
export const StyleToString = (k, v) => `${k}: ${v};`;
export const StylesToString = styles =>
  Object.entries(styles)
    .map(([k, v]) => StyleToString(k, v))
    .join('');
export const StyleSheet = styles => 
  Object.entries(styles)
    .map(([k, v]) => `${k} { ${StylesToString(GetStyles(v))} }`)
    .join('');

const SetStyle = (el, k, v) =>
  v === DROP
    ? el.style.removeProperty(to_kebab_case(k))
    : el.style.setProperty(to_kebab_case(k), v);

const SetAttr = (el, k, v) =>
  v === DROP ? el.removeAttribute(k) : el.setAttribute(k, v);

const SetProp = _.ObjectSet;

export const [SetStyleSig, SetStyles] = get_set_multi_fn(SetStyle);
export const [SetAttrSig, SetAttrs] = get_set_multi_fn(SetAttr);
export const [SetPropSig, SetProps] = get_set_multi_fn(SetProp);

export const PushEvent = (el, name, fn, options) =>
  el.addEventListener(name, fn, options);
export const PushEvents = (el, events) =>
  Object.entries(events).forEach(([name, fn_or_o]) => {
    typeof fn_or_o === 'function'
      ? PushEvent(el, name, fn_or_o)
      : PushEvent(el, name, fn_or_o.fn, fn_or_o.options);
  });

const _getActionList = options =>
  Object.keys(
    _.ObjectPick(options, [
      'styles',
      'attrs',
      'props',
      'events',
      'children',
      'useRef',
    ])
  );
const _getActionMap = options => ({
  styles: () => SetStyles(options.el, options.styles),
  attrs: () => SetAttrs(options.el, options.attrs),
  props: () => SetProps(options.el, options.props),
  events: () => PushEvents(options.el, options.events),
  children: () =>
    options.el.append(
      ..._.Flow(options.children, arr =>
        Array.isArray(arr) ? arr : [arr]
      ).map(H)
    ),
  useRef: () => options.useRef(options.el),
});

export const H = options => {
  if (typeof options === 'string') return options;
  if (options.el === _.UN)
    options.el = options.isSvg
      ? SVG(_.OnUN(options.tag, _.K('svg')))
      : Ele(_.OnUN(options.tag, _.K('div')));
  const actions = _getActionList(options);
  const actionMap = _getActionMap(options);
  actions.forEach(k => actionMap[k]());
  return options.el;
};
const void_tags = [
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'source',
  'track',
  'wbr',

  'DOCTYPE',

  'xml',
  'path',
];
const is_self_closing = tag => void_tags.includes(tag);
export const H_Static = (...options) => {
  if (options.length > 1) {
    return options.map(_.Pipe(H_Static)).join('');
  }
  options = options[0];
  if (typeof options === 'string') return options;
  const { tag, attrs, children, comment } = options;
  // comment <!-- ... -->
  if (comment !== _.UN) return _.StringEnclose(comment, '<!--', '-->');
  const isSelfClosing = is_self_closing(tag);
  return (() => {
    const preTag = _.OnUN(
      {
        xml: '?',
        DOCTYPE: '!',
      }[tag],
      _.K('')
    );
    const attrsStr = attrs
      ? _.Flow(
          Object.entries(attrs)
            .map(([k, v]) =>
              typeof v === 'boolean' ? (v ? k : '') : `${k}="${v}"`
            )
            .filter(s => s !== '')
            .join(' '),
          s => (s.length > 0 ? _.StringPrepend(s, ' ') : '')
        )
      : '';
    const preClose = isSelfClosing ? (tag === 'xml' ? '?' : '/') : '';
    const content =
      isSelfClosing || children === _.UN
        ? ''
        : (Array.isArray(children) ? children : [children])
            .map(_.Pipe(H_Static))
            .join('');
    const tail = isSelfClosing ? '' : `</${tag}>`;
    return `<${preTag}${tag}${attrsStr}${preClose}>${content}${tail}`;
  })();
};

export const GetTitle = () => document.head.getElementsByTagName('title')[0];
