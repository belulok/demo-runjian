!function(P) {
    "use strict";
    function $(P, U) {
        return x(P, U).width
    }
    function K(P, U) {
        return x(P, U).height
    }
    function Z(P, U) {
        return a.getEdgeHostPosition(P, U, "source")
    }
    function B(P, U) {
        return a.getEdgeHostPosition(P, U, "target")
    }
    function w(P, U) {
        var a = P.s(e)
          , Y = P.getEdgeGroup();
        if (Y) {
            var v = 0;
            if (Y.eachSiblingEdge(function(P) {
                U.isVisible(P) && P.s(e) == a && v++
            }),
            1 < v)
                return P.s(T) * (v - 1) / 2
        }
        return 0
    }
    function c(a, Y) {
        var v = a.s(e)
          , P = a.isLooped();
        if (!a.getEdgeGroup())
            return P ? a.s(T) : 0;
        var I, O = 0, r = 0, E = 0;
        return a.getEdgeGroup().getSiblings().each(function(P) {
            P.each(function(P) {
                var U;
                P._40I === a._40I && P.s(e) == v && Y.isVisible(P) && (U = P.s(T),
                E = (I ? r += E / 2 + U / 2 : I = P,
                U),
                P === a && (O = r))
            })
        }),
        P ? r - O + E : O - r / 2
    }
    function G(P, U) {
        return U = U.s("edge.corner.radius"),
        b.toRoundedCorner(P, U)
    }
    function O(P, v, I, U, a) {
        if (U.sort(function(P, U) {
            var a = P.getSourceAgent() === v ? P.getTargetAgent() : P.getSourceAgent()
              , Y = U.getSourceAgent() === v ? U.getTargetAgent() : U.getSourceAgent()
              , a = a.p()
              , Y = Y.p();
            if (I === t || I === n) {
                if (a.y > Y.y)
                    return 1;
                if (a.y < Y.y)
                    return -1
            } else {
                if (a.x > Y.x)
                    return 1;
                if (a.x < Y.x)
                    return -1
            }
            return b.sortFunc(P.getId(), U.getId())
        }),
        a) {
            for (var Y, O, r, E = P.getSourceAgent(), e = P.getTargetAgent(), i = 0; i < U.size(); i++) {
                var Q = U.get(i);
                Q.getSourceAgent() === E && Q.getTargetAgent() === e || Q.getTargetAgent() === E && Q.getSourceAgent() === e ? (O = O || new p).add(Q, 0) : (O ? r = r || new p : Y = Y || new p).add(Q)
            }
            U.empty(),
            Y && U.addAll(Y),
            O && U.addAll(O),
            r && U.addAll(r)
        }
        var a = U.indexOf(P)
          , o = U.size()
          , P = P.s(T);
        return {
            side: I,
            index: a,
            size: o,
            offset: -P * (o - 1) / 2 + P * a
        }
    }
    function f(U, P, a, Y, v) {
        var I = P.s(e);
        return O(P, a, Y, a.getAgentEdges().toList(function(P) {
            return U.isVisible(P) && P.s(e) === I
        }), v)
    }
    function I(P, U, a) {
        var Y = U.getSourceAgent() === a ? U.getTargetAgent() : U.getSourceAgent()
          , a = a instanceof D.Edge ? _(P, a, U) : a.p()
          , U = (P = Y instanceof D.Edge ? _(P, Y, U) : Y.p()).x - a.x
          , Y = P.y - a.y;
        return 0 < U && s(Y) <= U ? n : U < 0 && s(Y) <= -U ? t : 0 < Y && s(U) <= Y ? M : R
    }
    function X(U, P, a) {
        var Y = P.s(e)
          , v = I(U, P, a);
        return O(P, a, v, a.getAgentEdges().toList(function(P) {
            return U.isVisible(P) && P.s(e) === Y && I(U, P, a) === v
        }))
    }
    function r(P, U, a) {
        var Y = U.getSourceAgent() === a
          , v = Y ? U.getTargetAgent() : U.getSourceAgent()
          , I = a instanceof D.Edge
          , O = v instanceof D.Edge
          , I = I ? _(P, a, U) : a.p()
          , a = O ? _(P, v, U) : v.p();
        return Y ? I.y > a.y ? R : M : I.x < a.x ? n : t
    }
    function v(U, P, a) {
        var Y = P.s(e)
          , v = r(U, P, a);
        return O(P, a, v, a.getAgentEdges().toList(function(P) {
            return U.isVisible(P) && P.s(e) === Y && r(U, P, a) === v
        }), v === n || v === M)
    }
    function E(P, U, a) {
        var Y = U.getSourceAgent() === a
          , v = Y ? U.getTargetAgent() : U.getSourceAgent()
          , I = a instanceof D.Edge
          , O = v instanceof D.Edge
          , I = I ? _(P, a, U) : a.p()
          , a = O ? _(P, v, U) : v.p();
        return Y ? I.x < a.x ? n : t : I.y > a.y ? R : M
    }
    function i(U, P, a) {
        var Y = P.s(e)
          , v = E(U, P, a);
        return O(P, a, v, a.getAgentEdges().toList(function(P) {
            return U.isVisible(P) && P.s(e) === Y && E(U, P, a) === v
        }), v === n || v === M)
    }
    function Y(P, U, a) {
        var Y = P.getSourceAgent()
          , v = P.getTargetAgent()
          , I = Y.getId() > v.getId()
          , O = I ? v : Y
          , Y = I ? Y : v
          , v = O instanceof D.Edge
          , r = Y instanceof D.Edge
          , E = v ? _(U, O, P) : O.p()
          , e = r ? _(U, Y, P) : Y.p()
          , i = a(U, P, O)
          , a = a(U, P, Y)
          , Q = (f = P.s(L)) || v ? 0 : $(U, O) / 2
          , o = f || r ? 0 : $(U, Y) / 2
          , v = f || v ? 0 : K(U, O) / 2
          , O = f || r ? 0 : K(U, Y) / 2
          , f = i.offset
          , r = a.offset
          , U = i.side
          , Y = a.side
          , i = new p;
        return U === R ? (i.add({
            x: E.x + f,
            y: E.y - v
        }),
        i.add({
            x: E.x + f,
            y: e.y + r
        }),
        Y === t ? i.add({
            x: e.x - o,
            y: e.y + r
        }) : i.add({
            x: e.x + o,
            y: e.y + r
        })) : U === M ? (i.add({
            x: E.x + f,
            y: E.y + v
        }),
        i.add({
            x: E.x + f,
            y: e.y + r
        }),
        Y === t ? i.add({
            x: e.x - o,
            y: e.y + r
        }) : i.add({
            x: e.x + o,
            y: e.y + r
        })) : U === t ? (i.add({
            x: E.x - Q,
            y: E.y + f
        }),
        i.add({
            x: e.x + r,
            y: E.y + f
        }),
        Y === M ? i.add({
            x: e.x + r,
            y: e.y + O
        }) : i.add({
            x: e.x + r,
            y: e.y - O
        })) : U === n && (i.add({
            x: E.x + Q,
            y: E.y + f
        }),
        i.add({
            x: e.x + r,
            y: E.y + f
        }),
        Y === M ? i.add({
            x: e.x + r,
            y: e.y + O
        }) : i.add({
            x: e.x + r,
            y: e.y - O
        })),
        I && i.reverse(),
        G(i, P)
    }
    var D = P.ht
      , P = Math
      , y = P.max
      , g = P.min
      , s = P.abs
      , F = P.atan2
      , l = (P.cos,
    P.sin,
    P.ceil)
      , b = D.Default
      , a = b.getInternal()
      , p = D.List
      , A = a.Mat
      , x = a.getNodeRect
      , u = a.intersectionLineRect
      , J = b.getDistance
      , P = b.setEdgeType
      , U = (b.unionRect,
    b._edgeProtectMethod)
      , Q = U.getStraightLinePoints
      , o = U.getPercentPosition
      , t = "left"
      , n = "right"
      , R = "top"
      , M = "bottom"
      , e = "edge.type"
      , T = "edge.gap"
      , L = "edge.center"
      , W = "edge.extend"
      , _ = function(P, U, a) {
        P = P.getDataUI(U),
        U = Q(P),
        P = o(U, 50);
        return P || (a.iv(),
        {})
    };
    a.addMethod(D.Style, {
        "edge.ripple.elevation": -20,
        "edge.ripple.size": 1,
        "edge.ripple.both": !1,
        "edge.ripple.straight": !1,
        "edge.ripple.length": -1,
        "edge.corner.radius": -1,
        "edge.ortho": .5,
        "edge.flex": 20,
        "edge.extend": 20
    }, !0),
    P("boundary", function(P, U, a, Y) {
        Y || (U = -U);
        var Y = Z(a, P)
          , v = B(a, P)
          , I = P.getSource()
          , O = P.getTarget()
          , r = P.getSource()instanceof D.Edge
          , E = P.getTarget()instanceof D.Edge
          , e = new A(F(v.y - Y.y, v.x - Y.x))
          , i = J(Y, v)
          , Q = Y.x
          , o = Y.y
          , f = e.tf(0, U)
          , Y = {
            x: f.x + Q,
            y: f.y + o
        }
          , v = {
            x: (f = e.tf(i, U)).x + Q,
            y: f.y + o
        };
        return r ? Y = {
            x: (f = _(a, I, P)).x,
            y: f.y
        } : (e = x(a, I),
        (f = u(Y, v, e)) && (Y = {
            x: f[0],
            y: f[1]
        })),
        E ? v = {
            x: (f = _(a, O, P)).x,
            y: f.y
        } : (i = x(a, O),
        (f = u(Y, v, i)) && (v = {
            x: f[0],
            y: f[1]
        })),
        {
            points: new p([Y, v])
        }
    }),
    P("ripple", function(P, U, a, Y) {
        Y || (U = -U);
        var v = Z(a, P)
          , a = B(a, P)
          , I = J(v, a)
          , O = g(P.s("edge.offset"), I / 2)
          , r = P.s("edge.ripple.size")
          , E = P.s("edge.ripple.length")
          , e = P.s("edge.ripple.both")
          , i = P.s(L)
          , Q = P.s("edge.ripple.elevation")
          , o = new p
          , f = P.s("edge.ripple.straight") ? null : new p
          , y = new A(F(a.y - v.y, a.x - v.x))
          , c = (Y || (Q = -Q),
        (I -= 2 * O) / (r = 0 < E ? l(I / E) : r));
        f && f.add(1);
        for (var b = 0; b < r; b++)
            f && f.add(3),
            0 === b ? o.add({
                x: O + c * b,
                y: i ? 0 : U
            }) : o.add({
                x: O + c * b,
                y: U
            }),
            o.add({
                x: O + c * b + c / 2,
                y: Q + U
            }),
            e && (Q = -Q);
        for (o.add({
            x: O + I,
            y: i ? 0 : U
        }),
        b = 0; b < o.size(); b++) {
            var w = y.tf(o.get(b));
            w.x += v.x,
            w.y += v.y,
            o.set(b, w)
        }
        return {
            points: o,
            segments: f
        }
    }),
    P("h.v", function(P, U, a) {
        U = c(P, a);
        var Y = new p
          , v = P.s(L)
          , I = Z(a, P)
          , O = I.x
          , I = I.y
          , r = B(a, P)
          , E = r.x
          , r = r.y
          , e = P.getSource()instanceof D.Edge
          , i = P.getTarget()instanceof D.Edge
          , Q = 0
          , o = 0
          , f = E - O
          , y = r - I;
        return v || (Q = e ? 0 : $(a, P.getSource()) / 2,
        o = i ? 0 : K(a, P.getTarget()) / 2),
        0 <= f && y <= 0 ? (Y.add({
            x: O + Q,
            y: I + U
        }),
        Y.add({
            x: E + U,
            y: I + U
        }),
        Y.add({
            x: E + U,
            y: r + o
        })) : f <= 0 && 0 <= y ? (Y.add({
            x: O - Q,
            y: I + U
        }),
        Y.add({
            x: E + U,
            y: I + U
        }),
        Y.add({
            x: E + U,
            y: r - o
        })) : 0 <= f && 0 <= y ? (Y.add({
            x: O + Q,
            y: I + U
        }),
        Y.add({
            x: E - U,
            y: I + U
        }),
        Y.add({
            x: E - U,
            y: r - o
        })) : (Y.add({
            x: O - Q,
            y: I + U
        }),
        Y.add({
            x: E - U,
            y: I + U
        }),
        Y.add({
            x: E - U,
            y: r + o
        })),
        G(Y, P)
    }),
    P("v.h", function(P, U, a) {
        U = c(P, a);
        var Y = new p
          , v = P.s(L)
          , I = Z(a, P)
          , O = I.x
          , I = I.y
          , r = B(a, P)
          , E = r.x
          , r = r.y
          , e = P.getSource()instanceof D.Edge
          , i = P.getTarget()instanceof D.Edge
          , Q = 0
          , o = 0
          , f = E - O
          , y = r - I;
        return v || (Q = i ? 0 : $(a, P.getTarget()) / 2,
        o = e ? 0 : K(a, P.getSource()) / 2),
        0 <= f && y <= 0 ? (Y.add({
            x: O + U,
            y: I - o
        }),
        Y.add({
            x: O + U,
            y: r + U
        }),
        Y.add({
            x: E - Q,
            y: r + U
        })) : f <= 0 && 0 <= y ? (Y.add({
            x: O + U,
            y: I + o
        }),
        Y.add({
            x: O + U,
            y: r + U
        }),
        Y.add({
            x: E + Q,
            y: r + U
        })) : 0 <= f && 0 <= y ? (Y.add({
            x: O - U,
            y: I + o
        }),
        Y.add({
            x: O - U,
            y: r + U
        }),
        Y.add({
            x: E - Q,
            y: r + U
        })) : (Y.add({
            x: O - U,
            y: I - o
        }),
        Y.add({
            x: O - U,
            y: r + U
        }),
        Y.add({
            x: E + Q,
            y: r + U
        })),
        G(Y, P)
    }),
    P("ortho", function(P, U, a) {
        var Y = new p
          , v = P.s(L)
          , I = P.s("edge.ortho")
          , O = P.getSource()
          , r = P.getTarget()
          , E = Z(a, P)
          , e = E.x
          , E = E.y
          , i = B(a, P)
          , Q = i.x
          , i = i.y
          , o = Q - e
          , f = i - E
          , y = O instanceof D.Edge
          , c = r instanceof D.Edge
          , b = v || y ? 0 : $(a, O) / 2
          , y = v || y ? 0 : K(a, O) / 2
          , O = v || c ? 0 : $(a, r) / 2
          , v = v || c ? 0 : K(a, r) / 2
          , c = (o - (b + O) * (0 < o ? 1 : -1)) * I
          , a = (f - (y + v) * (0 < f ? 1 : -1)) * I;
        return s(o) < s(f) ? 0 <= o && f <= 0 ? (Y.add({
            x: e + U,
            y: E - y
        }),
        Y.add({
            x: e + U,
            y: E + a + U - y
        }),
        Y.add({
            x: Q + U,
            y: E + a + U - y
        }),
        Y.add({
            x: Q + U,
            y: i + v
        })) : o <= 0 && 0 <= f ? (Y.add({
            x: e + U,
            y: E + y
        }),
        Y.add({
            x: e + U,
            y: E + a + U + y
        }),
        Y.add({
            x: Q + U,
            y: E + a + U + y
        }),
        Y.add({
            x: Q + U,
            y: i - v
        })) : 0 <= o && 0 <= f ? (Y.add({
            x: e + U,
            y: E + y
        }),
        Y.add({
            x: e + U,
            y: E + a - U + y
        }),
        Y.add({
            x: Q + U,
            y: E + a - U + y
        }),
        Y.add({
            x: Q + U,
            y: i - v
        })) : (Y.add({
            x: e + U,
            y: E - y
        }),
        Y.add({
            x: e + U,
            y: E + a - U - y
        }),
        Y.add({
            x: Q + U,
            y: E + a - U - y
        }),
        Y.add({
            x: Q + U,
            y: i + v
        })) : 0 <= o && f <= 0 ? (Y.add({
            x: e + b,
            y: E + U
        }),
        Y.add({
            x: e + c + U + b,
            y: E + U
        }),
        Y.add({
            x: e + c + U + b,
            y: i + U
        }),
        Y.add({
            x: Q - O,
            y: i + U
        })) : o <= 0 && 0 <= f ? (Y.add({
            x: e - b,
            y: E + U
        }),
        Y.add({
            x: e + c + U - b,
            y: E + U
        }),
        Y.add({
            x: e + c + U - b,
            y: i + U
        }),
        Y.add({
            x: Q + O,
            y: i + U
        })) : 0 <= o && 0 <= f ? (Y.add({
            x: e + b,
            y: E + U
        }),
        Y.add({
            x: e + c - U + b,
            y: E + U
        }),
        Y.add({
            x: e + c - U + b,
            y: i + U
        }),
        Y.add({
            x: Q - O,
            y: i + U
        })) : (Y.add({
            x: e - b,
            y: E + U
        }),
        Y.add({
            x: e + c - U - b,
            y: E + U
        }),
        Y.add({
            x: e + c - U - b,
            y: i + U
        }),
        Y.add({
            x: Q + O,
            y: i + U
        })),
        G(Y, P)
    }),
    P("flex", function(P, U, a) {
        var Y = new p
          , v = P.s("edge.flex") + w(P, a)
          , I = P.s(L)
          , O = P.getSource()
          , r = P.getTarget()
          , E = Z(a, P)
          , e = E.x
          , E = E.y
          , i = B(a, P)
          , Q = i.x
          , i = i.y
          , o = O instanceof D.Edge
          , f = r instanceof D.Edge
          , y = Q - e
          , c = i - E
          , b = I || o ? 0 : $(a, O) / 2
          , o = I || o ? 0 : K(a, O) / 2
          , O = I || f ? 0 : $(a, r) / 2
          , I = I || f ? 0 : K(a, r) / 2
          , f = 0 < y ? v : -v
          , a = 0 < c ? v : -v;
        return s(y) < s(c) ? 0 <= y && c <= 0 ? (Y.add({
            x: e + U,
            y: E - o
        }),
        Y.add({
            x: e + U,
            y: E + a + U - o
        }),
        Y.add({
            x: Q + U,
            y: i - a + U + I
        }),
        Y.add({
            x: Q + U,
            y: i + I
        })) : y <= 0 && 0 <= c ? (Y.add({
            x: e + U,
            y: E + o
        }),
        Y.add({
            x: e + U,
            y: E + a + U + o
        }),
        Y.add({
            x: Q + U,
            y: i - a + U - I
        }),
        Y.add({
            x: Q + U,
            y: i - I
        })) : 0 <= y && 0 <= c ? (Y.add({
            x: e + U,
            y: E + o
        }),
        Y.add({
            x: e + U,
            y: E + a - U + o
        }),
        Y.add({
            x: Q + U,
            y: i - a - U - I
        }),
        Y.add({
            x: Q + U,
            y: i - I
        })) : (Y.add({
            x: e + U,
            y: E - o
        }),
        Y.add({
            x: e + U,
            y: E + a - U - o
        }),
        Y.add({
            x: Q + U,
            y: i - a - U + I
        }),
        Y.add({
            x: Q + U,
            y: i + I
        })) : 0 <= y && c <= 0 ? (Y.add({
            x: e + b,
            y: E + U
        }),
        Y.add({
            x: e + f + U + b,
            y: E + U
        }),
        Y.add({
            x: Q - f + U - O,
            y: i + U
        }),
        Y.add({
            x: Q - O,
            y: i + U
        })) : y <= 0 && 0 <= c ? (Y.add({
            x: e - b,
            y: E + U
        }),
        Y.add({
            x: e + f + U - b,
            y: E + U
        }),
        Y.add({
            x: Q - f + U + O,
            y: i + U
        }),
        Y.add({
            x: Q + O,
            y: i + U
        })) : 0 <= y && 0 <= c ? (Y.add({
            x: e + b,
            y: E + U
        }),
        Y.add({
            x: e + f - U + b,
            y: E + U
        }),
        Y.add({
            x: Q - f - U - O,
            y: i + U
        }),
        Y.add({
            x: Q - O,
            y: i + U
        })) : (Y.add({
            x: e - b,
            y: E + U
        }),
        Y.add({
            x: e + f - U - b,
            y: E + U
        }),
        Y.add({
            x: Q - f - U + O,
            y: i + U
        }),
        Y.add({
            x: Q + O,
            y: i + U
        })),
        G(Y, P)
    }),
    P("extend.east", function(P, U, a) {
        var Y = new p
          , v = P.s(W) + w(P, a)
          , I = P.s(L)
          , O = Z(a, P)
          , r = P.getSource()instanceof D.Edge
          , E = P.getTarget()instanceof D.Edge
          , r = O.x + (I || r ? 0 : $(a, P.getSource()) / 2)
          , O = O.y
          , e = B(a, P)
          , I = e.x + (I || E ? 0 : $(a, P.getTarget()) / 2)
          , E = e.y
          , a = y(r, I) + v;
        return E < O ? (Y.add({
            x: r,
            y: O + U
        }),
        Y.add({
            x: a + U,
            y: O + U
        }),
        Y.add({
            x: a + U,
            y: E - U
        }),
        Y.add({
            x: I,
            y: E - U
        })) : (Y.add({
            x: r,
            y: O - U
        }),
        Y.add({
            x: a + U,
            y: O - U
        }),
        Y.add({
            x: a + U,
            y: E + U
        }),
        Y.add({
            x: I,
            y: E + U
        })),
        G(Y, P)
    }),
    P("extend.west", function(P, U, a) {
        var Y = new p
          , v = P.s(W) + w(P, a)
          , I = P.s(L)
          , O = P.getSource()instanceof D.Edge
          , r = P.getTarget()instanceof D.Edge
          , E = Z(a, P)
          , O = E.x - (I || O ? 0 : $(a, P.getSource()) / 2)
          , E = E.y
          , e = B(a, P)
          , I = e.x - (I || r ? 0 : $(a, P.getTarget()) / 2)
          , r = e.y
          , a = g(O, I) - v;
        return r < E ? (Y.add({
            x: O,
            y: E + U
        }),
        Y.add({
            x: a - U,
            y: E + U
        }),
        Y.add({
            x: a - U,
            y: r - U
        }),
        Y.add({
            x: I,
            y: r - U
        })) : (Y.add({
            x: O,
            y: E - U
        }),
        Y.add({
            x: a - U,
            y: E - U
        }),
        Y.add({
            x: a - U,
            y: r + U
        }),
        Y.add({
            x: I,
            y: r + U
        })),
        G(Y, P)
    }),
    P("extend.north", function(P, U, a) {
        var Y = new p
          , v = P.s(W) + w(P, a)
          , I = P.s(L)
          , O = P.getSource()instanceof D.Edge
          , r = P.getTarget()instanceof D.Edge
          , E = Z(a, P)
          , e = E.x
          , E = E.y - (I || O ? 0 : K(a, P.getSource()) / 2)
          , O = B(a, P)
          , i = O.x
          , O = O.y - (I || r ? 0 : K(a, P.getTarget()) / 2)
          , I = g(E, O) - v;
        return i < e ? (Y.add({
            y: E,
            x: e + U
        }),
        Y.add({
            y: I - U,
            x: e + U
        }),
        Y.add({
            y: I - U,
            x: i - U
        }),
        Y.add({
            y: O,
            x: i - U
        })) : (Y.add({
            y: E,
            x: e - U
        }),
        Y.add({
            y: I - U,
            x: e - U
        }),
        Y.add({
            y: I - U,
            x: i + U
        }),
        Y.add({
            y: O,
            x: i + U
        })),
        G(Y, P)
    }),
    P("extend.south", function(P, U, a) {
        var Y = new p
          , v = P.s(W) + w(P, a)
          , I = P.s(L)
          , O = P.getSource()instanceof D.Edge
          , r = P.getTarget()instanceof D.Edge
          , E = Z(a, P)
          , e = E.x
          , E = E.y + (I || O ? 0 : K(a, P.getSource()) / 2)
          , O = B(a, P)
          , i = O.x
          , O = O.y + (I || r ? 0 : K(a, P.getTarget()) / 2)
          , I = y(E, O) + v;
        return i < e ? (Y.add({
            y: E,
            x: e + U
        }),
        Y.add({
            y: I + U,
            x: e + U
        }),
        Y.add({
            y: I + U,
            x: i - U
        }),
        Y.add({
            y: O,
            x: i - U
        })) : (Y.add({
            y: E,
            x: e - U
        }),
        Y.add({
            y: I + U,
            x: e - U
        }),
        Y.add({
            y: I + U,
            x: i + U
        }),
        Y.add({
            y: O,
            x: i + U
        })),
        G(Y, P)
    });
    P("ortho2", function(P, U, a, Y) {
        var v, I, O = P.s(L), r = P.s("edge.ortho"), E = P.getSourceAgent(), e = P.getTargetAgent(), i = E.getId() > e.getId(), Q = i ? e : E, E = i ? E : e, e = Q instanceof D.Edge, o = E instanceof D.Edge, f = e ? _(a, Q, P) : Q.p(), y = o ? _(a, E, P) : E.p(), c = X(a, P, Q), b = X(a, P, E), w = O || e ? 0 : $(a, Q) / 2, e = O || e ? 0 : K(a, Q) / 2, Q = O || o ? 0 : $(a, E) / 2, O = O || o ? 0 : K(a, E) / 2, o = new p, a = c.offset, E = b.offset, b = c.side;
        return b === n ? (v = y.y > f.y ? -a : a,
        I = f.x + w + (y.x - Q - f.x - w) * r,
        o.add({
            x: f.x + w,
            y: f.y + a
        }),
        o.add({
            x: I + v,
            y: f.y + a
        }),
        o.add({
            x: I + v,
            y: y.y + E
        }),
        o.add({
            x: y.x - Q,
            y: y.y + E
        })) : b === t ? (v = y.y > f.y ? -a : a,
        I = f.x - w - (f.x - w - y.x - Q) * r,
        o.add({
            x: f.x - w,
            y: f.y + a
        }),
        o.add({
            x: I - v,
            y: f.y + a
        }),
        o.add({
            x: I - v,
            y: y.y + E
        }),
        o.add({
            x: y.x + Q,
            y: y.y + E
        })) : b === M ? (v = y.x > f.x ? -a : a,
        I = f.y + e + (y.y - O - f.y - e) * r,
        o.add({
            x: f.x + a,
            y: f.y + e
        }),
        o.add({
            x: f.x + a,
            y: I + v
        }),
        o.add({
            x: y.x + E,
            y: I + v
        }),
        o.add({
            x: y.x + E,
            y: y.y - O
        })) : b === R && (v = y.x > f.x ? -a : a,
        I = f.y - e - (f.y - e - y.y - O) * r,
        o.add({
            x: f.x + a,
            y: f.y - e
        }),
        o.add({
            x: f.x + a,
            y: I - v
        }),
        o.add({
            x: y.x + E,
            y: I - v
        }),
        o.add({
            x: y.x + E,
            y: y.y + O
        })),
        i && o.reverse(),
        G(o, P)
    }, !0),
    P("flex2", function(P, U, a, Y) {
        var v, I = P.getSourceAgent(), O = P.getTargetAgent(), r = I.getId() > O.getId(), E = r ? O : I, I = r ? I : O, O = E instanceof D.Edge, e = I instanceof D.Edge, i = O ? _(a, E, P) : E.p(), Q = e ? _(a, I, P) : I.p(), o = X(a, P, E), f = X(a, P, I), y = P.s(L), c = P.s("edge.flex") + (o.size - 1) / 2 * P.s(T), b = y || O ? 0 : $(a, E) / 2, O = y || O ? 0 : K(a, E) / 2, E = y || e ? 0 : $(a, I) / 2, y = y || e ? 0 : K(a, I) / 2, e = new p, a = o.offset, I = f.offset, f = o.side;
        return f === n ? (v = Q.y > i.y ? -a : a,
        e.add({
            x: i.x + b,
            y: i.y + a
        }),
        e.add({
            x: i.x + b + c + v,
            y: i.y + a
        }),
        e.add({
            x: Q.x - E - c + v,
            y: Q.y + I
        }),
        e.add({
            x: Q.x - E,
            y: Q.y + I
        })) : f === t ? (v = Q.y > i.y ? -a : a,
        e.add({
            x: i.x - b,
            y: i.y + a
        }),
        e.add({
            x: i.x - b - c - v,
            y: i.y + a
        }),
        e.add({
            x: Q.x + E + c - v,
            y: Q.y + I
        }),
        e.add({
            x: Q.x + E,
            y: Q.y + I
        })) : f === M ? (v = Q.x > i.x ? -a : a,
        e.add({
            x: i.x + a,
            y: i.y + O
        }),
        e.add({
            x: i.x + a,
            y: i.y + O + c + v
        }),
        e.add({
            x: Q.x + I,
            y: Q.y - y - c + v
        }),
        e.add({
            x: Q.x + I,
            y: Q.y - y
        })) : f === R && (v = Q.x > i.x ? -a : a,
        e.add({
            x: i.x + a,
            y: i.y - O
        }),
        e.add({
            x: i.x + a,
            y: i.y - O - c - v
        }),
        e.add({
            x: Q.x + I,
            y: Q.y + y + c - v
        }),
        e.add({
            x: Q.x + I,
            y: Q.y + y
        })),
        r && e.reverse(),
        G(e, P)
    }, !0),
    P("extend.north2", function(P, U, a) {
        var Y = P.getSourceAgent()
          , v = P.getTargetAgent()
          , I = Y.getId() > v.getId()
          , O = I ? v : Y
          , Y = I ? Y : v
          , v = O instanceof D.Edge
          , r = Y instanceof D.Edge
          , E = v ? _(a, O, P) : O.p()
          , e = r ? _(a, Y, P) : Y.p()
          , i = f(a, P, O, R)
          , Q = f(a, P, Y, R, !0)
          , o = P.s(L)
          , v = o || v ? 0 : K(a, O) / 2
          , O = o || r ? 0 : K(a, Y) / 2
          , o = i.offset
          , r = Q.offset
          , a = P.s(W) + (i.size - 1) / 2 * P.s(T)
          , Y = g(E.y - v, e.y - O) - a + (E.x < e.x ? o : -o)
          , Q = new p;
        return Q.add({
            x: E.x + o,
            y: E.y - v
        }),
        Q.add({
            x: E.x + o,
            y: Y
        }),
        Q.add({
            x: e.x + r,
            y: Y
        }),
        Q.add({
            x: e.x + r,
            y: e.y - O
        }),
        I && Q.reverse(),
        G(Q, P)
    }, !0),
    P("extend.south2", function(P, U, a) {
        var Y = P.getSourceAgent()
          , v = P.getTargetAgent()
          , I = Y.getId() > v.getId()
          , O = I ? v : Y
          , Y = I ? Y : v
          , v = O instanceof D.Edge
          , r = Y instanceof D.Edge
          , E = v ? _(a, O, P) : O.p()
          , e = r ? _(a, Y, P) : Y.p()
          , i = f(a, P, O, M)
          , Q = f(a, P, Y, M, !0)
          , o = P.s(L)
          , v = o || v ? 0 : K(a, O) / 2
          , O = o || r ? 0 : K(a, Y) / 2
          , o = i.offset
          , r = Q.offset
          , a = P.s(W) + (i.size - 1) / 2 * P.s(T)
          , Y = y(E.y + v, e.y + O) + a + (E.x > e.x ? o : -o)
          , Q = new p;
        return Q.add({
            x: E.x + o,
            y: E.y + v
        }),
        Q.add({
            x: E.x + o,
            y: Y
        }),
        Q.add({
            x: e.x + r,
            y: Y
        }),
        Q.add({
            x: e.x + r,
            y: e.y + O
        }),
        I && Q.reverse(),
        G(Q, P)
    }, !0),
    P("extend.west2", function(P, U, a) {
        var Y = P.getSourceAgent()
          , v = P.getTargetAgent()
          , I = Y.getId() > v.getId()
          , O = I ? v : Y
          , Y = I ? Y : v
          , v = O instanceof D.Edge
          , r = Y instanceof D.Edge
          , E = v ? _(a, O, P) : O.p()
          , e = r ? _(a, Y, P) : Y.p()
          , i = f(a, P, O, R)
          , Q = f(a, P, Y, R, !0)
          , o = P.s(L)
          , v = o || v ? 0 : $(a, O) / 2
          , O = o || r ? 0 : $(a, Y) / 2
          , o = i.offset
          , r = Q.offset
          , a = P.s(W) + (i.size - 1) / 2 * P.s(T)
          , Y = g(E.x - v, e.x - O) - a + (E.y < e.y ? o : -o)
          , Q = new p;
        return Q.add({
            x: E.x - v,
            y: E.y + o
        }),
        Q.add({
            x: Y,
            y: E.y + o
        }),
        Q.add({
            x: Y,
            y: e.y + r
        }),
        Q.add({
            x: e.x - O,
            y: e.y + r
        }),
        I && Q.reverse(),
        G(Q, P)
    }, !0),
    P("extend.east2", function(P, U, a) {
        var Y = P.getSourceAgent()
          , v = P.getTargetAgent()
          , I = Y.getId() > v.getId()
          , O = I ? v : Y
          , Y = I ? Y : v
          , v = O instanceof D.Edge
          , r = Y instanceof D.Edge
          , E = v ? _(a, O, P) : O.p()
          , e = r ? _(a, Y, P) : Y.p()
          , i = f(a, P, O, R)
          , Q = f(a, P, Y, R, !0)
          , o = P.s(L)
          , v = o || v ? 0 : $(a, O) / 2
          , O = o || r ? 0 : $(a, Y) / 2
          , o = i.offset
          , r = Q.offset
          , a = P.s(W) + (i.size - 1) / 2 * P.s(T)
          , Y = y(E.x + v, e.x + O) + a + (E.y > e.y ? o : -o)
          , Q = new p;
        return Q.add({
            x: E.x + v,
            y: E.y + o
        }),
        Q.add({
            x: Y,
            y: E.y + o
        }),
        Q.add({
            x: Y,
            y: e.y + r
        }),
        Q.add({
            x: e.x + O,
            y: e.y + r
        }),
        I && Q.reverse(),
        G(Q, P)
    }, !0),
    P("v.h2", function(P, U, a) {
        return Y(P, a, v)
    }, !0),
    P("h.v2", function(P, U, a) {
        return Y(P, a, i)
    }, !0)
}("undefined" != typeof global ? global : "undefined" != typeof self ? self : "undefined" != typeof window ? window : (0,
eval)("this"), Object);
