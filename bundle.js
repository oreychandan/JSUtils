// src/lib/core.js
var Log = console.log;
var UN = void 0;
var Void = () => {
};
var K = (v) => () => v;
var V = (v) => (f) => f(v);
var R = (get_f) => {
  const self = {};
  self.f = get_f(self);
  return (...args) => self.f(...args);
};
var Pipe = (...fns) => (v) => fns.reduce((r, g) => g(r), v);
var Flow = (v, ...fns) => Pipe(...fns)(v);
var OnUN = (v, getV) => v === UN ? getV() : v;
var Mutable = (v) => ObjectFreeze({
  get: () => v,
  set: (v2) => v = v2
});
var MapMutable = (m, map) => {
  const skip = Symbol("skip");
  const v = map(m.get(), skip);
  if (v === skip) return;
  m.set(v);
};
var ObjectSet = (o, k, v) => o[k] = v;
var ObjectFreeze = Object.freeze;
var ObjectClone = (o) => ({ ...o });
var ObjectOmit = (o, keys, mutate = false) => {
  const _obj = mutate ? o : { ...o };
  for (const k of keys) {
    delete _obj[k];
  }
  return _obj;
};
var ObjectPick = (o, keys, mutate = false) => ObjectOmit(
  o,
  new Set(Object.keys(o)).difference(new Set(keys)).values(),
  mutate
);
var ObjectMapEntries = (o, map) => Object.fromEntries(Object.entries(o).map(map));
var Signal = (v, f = Void) => {
  const value = Mutable(v), event = Mutable(f);
  return ObjectFreeze({
    get: value.get,
    set: (v2) => {
      value.set(v2);
      event.get()(v2);
    },
    event
  });
};
var Emit = (emittable, v) => {
  if (typeof emittable === "function") emittable(v);
  else if (Array.isArray(emittable) || emittable instanceof Set || emittable instanceof Map) {
    emittable.forEach(V(v));
  } else if (typeof emittable === "object" && emittable !== null) {
    Emit(Object.values(emittable), v);
  } else {
    return new Error("Emit: data must be an iterable, function, or an object");
  }
};
var EmitTo = (emittable) => (v) => Emit(emittable, v);

// src/lib/dom.js
var Ele = (tag) => document.createElement(tag);
var svg_namespace = "http://www.w3.org/2000/svg";
var SVG = (tag) => document.createElementNS(svg_namespace, tag);
var to_kebab_case = (s) => s.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
var DROP = Symbol("DROP");
var get_set_sig_fn = (set_fn) => (el, k, set_listener) => set_listener((v) => set_fn(el, k, v));
var get_set_multi_fn = (set_fn) => {
  const set_sig = get_set_sig_fn(set_fn);
  return [
    set_sig,
    R((set_multi) => (el, data) => {
      if (typeof data === "function") data((d) => set_multi.f(el, d));
      else {
        Object.entries(data).forEach(
          ([k, v]) => (typeof v === "function" ? set_sig : set_fn)(el, k, v)
        );
      }
    })
  ];
};
var GetStyles = (styles) => ObjectMapEntries(styles, ([k, v]) => [to_kebab_case(k), v]);
var StyleToString = (k, v) => `${k}: ${v};`;
var StylesToString = (styles) => Object.entries(styles).map(([k, v]) => StyleToString(k, v)).join("");
var StyleSheet = (styles) => Object.entries(styles).map(([k, v]) => `${k} { ${StylesToString(GetStyles(v))} }`).join("");
var SetStyle = (el, k, v) => v === DROP ? el.style.removeProperty(to_kebab_case(k)) : el.style.setProperty(to_kebab_case(k), v);
var SetAttr = (el, k, v) => v === DROP ? el.removeAttribute(k) : el.setAttribute(k, v);
var SetProp = ObjectSet;
var [SetStyleSig, SetStyles] = get_set_multi_fn(SetStyle);
var [SetAttrSig, SetAttrs] = get_set_multi_fn(SetAttr);
var [SetPropSig, SetProps] = get_set_multi_fn(SetProp);
var PushEvent = (el, name, fn, options) => el.addEventListener(name, fn, options);
var PushEvents = (el, events) => Object.entries(events).forEach(([name, fn_or_o]) => {
  typeof fn_or_o === "function" ? PushEvent(el, name, fn_or_o) : PushEvent(el, name, fn_or_o.fn, fn_or_o.options);
});
var _getActionList = (options) => Object.keys(
  ObjectPick(options, [
    "styles",
    "attrs",
    "props",
    "events",
    "children",
    "useRef"
  ])
);
var _getActionMap = (options) => ({
  styles: () => SetStyles(options.el, options.styles),
  attrs: () => SetAttrs(options.el, options.attrs),
  props: () => SetProps(options.el, options.props),
  events: () => PushEvents(options.el, options.events),
  children: () => options.el.append(
    ...Flow(
      options.children,
      (arr) => Array.isArray(arr) ? arr : [arr]
    ).map(H)
  ),
  useRef: () => options.useRef(options.el)
});
var H = (options) => {
  if (typeof options === "string") return options;
  if (options.el === UN)
    options.el = options.isSvg ? SVG(OnUN(options.tag, K("svg"))) : Ele(OnUN(options.tag, K("div")));
  const actions = _getActionList(options);
  const actionMap = _getActionMap(options);
  actions.forEach((k) => actionMap[k]());
  return options.el;
};

// src/apps/jobWay.js
var app = () => {
  const state = {};
  const userActions = {};
  state.CurrentNavActions = {
    UI_NavContent: Void,
    Map_CurrentNavWithPrev: Void
  };
  state.CurrentNav = Signal("Discover", EmitTo(state.CurrentNavActions));
  state.CurrentNavWithPrevActions = {
    Map_DiscoverIsActive: Void,
    Map_ActivitiesIsActive: Void,
    Map_ProfileIsActive: Void
  };
  state.CurrentNavWithPrev = Signal(
    [state.CurrentNav.get(), UN],
    EmitTo(state.CurrentNavWithPrevActions)
  );
  state.CurrentNavActions.Map_CurrentNavWithPrev = (kind) => MapMutable(state.CurrentNavWithPrev, ([kindPrev]) => [kind, kindPrev]);
  state.DiscoverIsActiveActions = {
    UI_DiscoverColor: Void,
    UI_DiscoverTextDecoration: Void
  };
  state.ActivitiesIsActiveActions = ObjectClone(
    state.DiscoverIsActiveActions
  );
  state.ProfileIsActiveActions = ObjectClone(state.DiscoverIsActiveActions);
  state.DiscoverIsActive = Signal(
    state.CurrentNavWithPrev.get()[0] === "Discover",
    EmitTo(state.DiscoverIsActiveActions)
  );
  state.ActivitiesIsActive = Signal(
    state.CurrentNavWithPrev.get()[0] === "Activities",
    EmitTo(state.ActivitiesIsActiveActions)
  );
  state.ProfileIsActive = Signal(
    state.CurrentNavWithPrev.get()[0] === "Profile",
    EmitTo(state.ProfileIsActiveActions)
  );
  state.DiscoverIsActive.event.get(state.DiscoverIsActive.get());
  const getKindIsActiveF = (targetKind) => ([kind, kindPrev]) => {
    if (kind === targetKind) {
      state[`${targetKind}IsActive`].set(true);
    } else if (kindPrev === targetKind) {
      state[`${targetKind}IsActive`].set(false);
    }
  };
  Object.assign(state.CurrentNavWithPrevActions, {
    Map_DiscoverIsActive: getKindIsActiveF("Discover"),
    Map_ActivitiesIsActive: getKindIsActiveF("Activities"),
    Map_ProfileIsActive: getKindIsActiveF("Profile")
  });
  userActions.NavBttnClick = (kindNext) => {
    MapMutable(state.CurrentNav, (kind, skip) => {
      if (kind === kindNext) {
        Log(`Probably should refresh ${kindNext} page`);
        return skip;
      } else {
        return kindNext;
      }
    });
  };
  const Root = () => ({
    el: document.getElementById("root"),
    styles: {
      display: "flex",
      flexDirection: "column",
      height: "100vh"
    },
    children: [AppStyleSheet(), NavContent(), NavBar()]
  });
  const AppStyleSheet = () => ({
    tag: "style",
    props: {
      innerText: StyleSheet({
        button: {
          backgroundColor: "aliceblue",
          position: "relative",
          border: "none"
        }
        // 'button::before': {
        //   content: "''",
        //   position: 'absolute',
        //   top: '0',
        //   bottom: '0',
        //   left: '-2px' /* Adjust the position as needed */,
        //   width: '2px' /* Adjust the width as needed */,
        //   backgroundColor: ' #90b7d7' /* Adjust the color as needed */,
        // },
        // 'button:active': {
        //   boxShadow: 'inset 0 0 10px 2px #90b7d7',
        // },
      })
    }
  });
  const NavContent = () => ({
    styles: {
      flexGrow: "1",
      backgroundColor: "aliceblue",
      userSelect: "none",
      // temp styles
      padding: "20px",
      fontSize: "xx-large",
      fontFamily: '"DM Serif Text", serif',
      fontWeight: 400,
      fontStyle: "normal"
    },
    props: {
      innerText: (setStyle) => {
        state.CurrentNavActions.UI_NavContent = setStyle;
        setStyle(state.CurrentNav.get());
      }
    }
  });
  const NavBar = () => ({
    styles: {
      display: "flex",
      boxShadow: "0px 0px 4px 0px black"
    },
    children: [DiscoverButton(), ActivitiesButton(), ProfileButton()]
  });
  const bttnStyles = (navKind) => ({
    flexGrow: "1",
    padding: "13px 0px",
    fontFamily: "monospace",
    fontVariant: "small-caps",
    fontSize: "x-large",
    userSelect: "none",
    color: (setColor) => {
      state[`${navKind}IsActiveActions`][`UI_${navKind}Color`] = (b) => b ? setColor("blue") : setColor("black");
      state[`${navKind}IsActiveActions`][`UI_${navKind}Color`](
        state[`${navKind}IsActive`].get()
      );
    },
    textDecoration: (setDecoration) => {
      state[`${navKind}IsActiveActions`][`UI_${navKind}TextDecoration`] = (b) => b ? setDecoration("overline") : setDecoration("none");
      state[`${navKind}IsActiveActions`][`UI_${navKind}TextDecoration`](
        state[`${navKind}IsActive`].get()
      );
    }
  });
  const DiscoverButton = () => ({
    tag: "button",
    styles: bttnStyles("Discover"),
    props: {
      innerText: "Discover"
    },
    events: {
      click: () => userActions.NavBttnClick("Discover")
    }
  });
  const ActivitiesButton = () => ({
    tag: "button",
    styles: bttnStyles("Activities"),
    props: {
      innerText: "Activities"
    },
    events: {
      click: () => userActions.NavBttnClick("Activities")
    }
  });
  const ProfileButton = () => ({
    tag: "button",
    styles: bttnStyles("Profile"),
    props: {
      innerText: "Profile"
    },
    events: {
      click: () => userActions.NavBttnClick("Profile")
    }
  });
  H(Root());
};

// src/main.js
app();
