export const Log = console.log;
export const LogGroup = console.group;
export const LogGroupEnd = console.groupEnd;
export const UN = undefined;
export const Void = () => {};
export const I = v => v;
export const K = v => () => v;
export const E =
  (f, returnF = false) =>
  v => (f(v), returnF ? f : v);
export const V = v => f => f(v);
/**
 * getf : self => (...args) => any
 *
 * self.f : (...args) => any
 */
export const R = get_f => {
  const self = {};
  self.f = get_f(self);
  return (...args) => self.f(...args);
};
export const Do = f => f();
export const DoAll = (...fns) => fns.forEach(Do);
export const TypeOf = v => typeof v;
export const Pack = (...args) => args;
export const PackTo =
  f =>
  (...args) =>
    f(args);
export const SpreadTo = f => args => f(...args);
export const Pipe =
  (...fns) =>
  v =>
    fns.reduce((r, g) => g(r), v);
export const Flow = (v, ...fns) => Pipe(...fns)(v);

export const OnUN = (v, getV) => (v === UN ? getV() : v);

export const Lazy = (get = I) => {
  let _ = a => {
    const v = get(a);
    get = UN;
    _ = () => v;
    return v;
  };
  return a => _(a);
};
export const Mutable = v =>
  ObjectFreeze({
    get: () => v,
    set: v2 => (v = v2),
  });
export const MutableOK = (o, k) =>
  ObjectFreeze({
    get: () => o[k],
    set: v => (o[k] = v),
  });
export const MutableMK = (o, k) =>
  ObjectFreeze({
    get: () => o.get(k),
    set: v => o.set(k, v),
  });
export const MapMutable = (m, map) => {
  const skip = Symbol('skip');
  const v = map(m.get(), skip);
  if (v === skip) return;
  m.set(v);
};

export const MapMutableMK = (o, k, map) => MapMutable(MutableMK(o, k), map);
/**
 * R-Recursion using Mutable
 *
 * get_f : self => (...args) => any
 */
export const R_M = get_f => {
  const self = Mutable();
  self.set(get_f(self));
  return (...args) => self.get()(...args);
};
/**
 * should only be used when you need to break out of a loop
 * @returns Object indicating if the loop was broken (break = true) or completed (break = false)
 */
export const ForEach = (iterable, callback) => {
  const Break = Symbol('break');
  let i = 0;
  for (const v of iterable) {
    if (callback(v, { i, iterable, Break }) === Break) {
      return {
        break: true,
      };
    }
    i++;
  }
  return {
    break: false,
  };
};

/**
 * Needs further thought
 */
export const PipeBreakable =
  (...fns) =>
  init => {
    let v = init;
    ForEach(fns, (f, { Break }) => {
      if (typeof f === 'function') v = f(v);
      else v = f.f(v, Break);
      return v;
    });
    return v;
  };

// {
//   // test for pipe breakable
//   const pipe = PipeBreakable(
//     n => n + 1,
//     {
//       // breakable
//       f: (n, Break) => (n < 0 ? Break : `number: ${n}`),
//     },
//     E(Log),
//   );
//   pipe(1);
//   pipe(-1);
//   pipe(-5);
// }

export const FeedObject = (o1, o2) =>
  Object.entries(o2).forEach(([k, v]) => o1.set(k, v));

export const MapToObj = m => Object.fromEntries(m.entries());
// Object Utils
export const ObjectGet = (o, k) => o[k];
export const ObjectSet = (o, k, v) => (o[k] = v);
export const ObjectFreeze = Object.freeze;
export const ObjectSeal = Object.seal;
export const ObjectClone = o => ({ ...o });
export const ObjectIsEmpty = o => ArrayIsEmpty(Object.keys(o));
export const ObjectClear = o => Object.keys(o).forEach(k => delete o[k]);
export const ObjectIsKeyValid = k =>
  ['string', 'number', 'symbol'].includes(typeof k);

export const ObjectOmit = (o, keys, mutate = false) => {
  const _obj = mutate ? o : { ...o };
  for (const k of keys) {
    delete _obj[k];
  }
  return _obj;
};
export const ObjectPick = (o, keys, mutate = false) =>
  ObjectOmit(
    o,
    new Set(Object.keys(o)).difference(new Set(keys)).values(),
    mutate
  );
export const ObjectMapEntries = (o, map) =>
  Object.fromEntries(Object.entries(o).map(map));
export const ObjectGetGetter = o => k => o[k];
export const ObjectGetSetter = o => (k, v) => (o[k] = v);

export const ObjectToMap = o => new Map(Object.entries(o));

// Array Utils
export const ArrayNew = (size = 0, getInit) => {
  const arr = new Array(size);
  if (typeof getInit === 'function') arr.fill(getInit());
  return arr;
};
export const ArrayMapMutate = (arr, f) =>
  arr.forEach((v, i) => (arr[i] = f(v)));
export const ArrayFillInBetween = (arr, f, mutate = false) => {
  arr = mutate ? arr : [...arr];
  let i = 0,
    j = 0;
  while (i < arr.length - 1) {
    i++;
    arr.splice(i, 0, f(i, j));
    i++;
    j++;
  }
  return arr;
};
export const ArrayClone = arr => [...arr];
export const ArrayClear = arr => arr.splice(0, arr.length);
export const ArrayRemove = (arr, i) => arr.splice(i, 1);
export const ArrayIndex = (arr, i) => (i >= 0 ? i : arr.length + i);
export const ArrayIsEmpty = arr => arr.length === 0;
export const ArrayInsert = (arr, i, v) => arr.splice(i, 0, v);
export const ArraySet = ObjectSet;

// String Utils
export const StringEnclose = (s, left, right = left) => `${left}${s}${right}`;
export const StringAppend = (s, by) => StringEnclose(s, '', by);
export const StringPrepend = (s, by) => StringEnclose(s, by, '');
export const StringSlice = (s, start, count = s.length) =>
  s.slice(start, start + count);
export const StringSplice = (s, start, deleteCount, insert = '') =>
  `${s.slice(0, start)}${insert}${s.slice(start + deleteCount)}`;

// wrappers or specific functions

export const LocalStorage = {
  get: k => localStorage.getItem(k),
  set: (k, v) => localStorage.setItem(k, v),
  remove: k => localStorage.removeItem(k),
  clear: () => localStorage.clear(),
  length: () => localStorage.length,
  keyAtIndex: i => localStorage.key(i),
  has: k => localStorage.getItem(k) !== null,
  keys: () =>
    ArrayNew(localStorage.length, K()).map((_, i) =>
      LocalStorage.keyAtIndex(i)
    ),
};

export const Perf = f => {
  const start = performance.now();
  const result = f();
  const end = performance.now();
  const time = end - start;
  return {
    result,
    time,
  };
};

export const Signal = (v, f = Void) => {
  const value = Mutable(v),
    event = Mutable(f);
  return ObjectFreeze({
    get: value.get,
    set: v => {
      value.set(v);
      (f => f && f(v))(event.get());
    },
    event,
  });
};

export const Emit = (emittable, v) => {
  if (typeof emittable === 'function') emittable(v);
  else if (
    Array.isArray(emittable) ||
    emittable instanceof Set ||
    emittable instanceof Map
  ) {
    emittable.forEach(V(v));
  } else if (typeof emittable === 'object' && emittable !== null) {
    Emit(Object.values(emittable), v);
  } else {
    return new Error('Emit: data must be an iterable, function, or an object');
  }
};
export const EmitTo = emittable => v => Emit(emittable, v);
/**
 * Forwards values from a list of listeners to an emitter.
 *
 * @param setListenerList - List of functions that can take a listener.
 * @param getEmittable - A signal.event mutable | function | Array<function> | Map<any, function>
 */
export const Tunnel = (setListenerList, getEmittable) =>
  Flow(
    // v => Emit(getEmittable(), v),
    v => getEmittable()(v),
    l => setListenerList.forEach(V(l))
  );

// TODO: under review

export const Method =
  (name, ...args) =>
  o =>
    o[name](...args);

export const Then = f => Method('then', f);
// (p) => p.then(f);

export const PromisePipe = (...fns) => Pipe(...fns.map(Then));
