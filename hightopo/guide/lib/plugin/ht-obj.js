!function(R, B3, Is) {
    "use strict";
    (function(y) {
        "use strict";
        var P, p = function y(C, g, F, H) {
            var s = C & 65535 | 0
              , u = C >>> 16 & 65535 | 0
              , L = 0;
            while (F !== 0) {
                L = F > 2e3 ? 2e3 : F;
                F -= L;
                do {
                    s = s + g[H++] | 0;
                    u = u + s | 0
                } while (--L);
                s %= 65521;
                u %= 65521
            }
            return s | u << 16 | 0
        }, S, z = new Uint32Array(function y() {
            var C, g = [];
            for (var F = 0; F < 256; F++) {
                C = F;
                for (var H = 0; H < 8; H++)
                    C = C & 1 ? 3988292384 ^ C >>> 1 : C >>> 1;
                g[F] = C
            }
            return g
        }()), Q, t = function y(C, g, F, H) {
            var s = z;
            var u = H + F;
            C ^= -1;
            for (var L = H; L < u; L++)
                C = C >>> 8 ^ s[(C ^ g[L]) & 255];
            return C ^ -1
        }, E = 16209, B = 16191, K = function y(C, g) {
            var F;
            var H;
            var s;
            var u;
            var L;
            var O;
            var d;
            var P;
            var o;
            var A;
            var q;
            var Z;
            var Y;
            var S;
            var z;
            var Q;
            var I;
            var _;
            var J;
            var n;
            var r;
            var j;
            var $, R;
            var V = C.state;
            F = C.next_in;
            $ = C.input;
            H = F + (C.avail_in - 5);
            s = C.next_out;
            R = C.output;
            u = s - (g - C.avail_out);
            L = s + (C.avail_out - 257);
            O = V.dmax;
            d = V.wsize;
            P = V.whave;
            o = V.wnext;
            A = V.window;
            q = V.hold;
            Z = V.bits;
            Y = V.lencode;
            S = V.distcode;
            z = (1 << V.lenbits) - 1;
            Q = (1 << V.distbits) - 1;
            y: do {
                if (Z < 15) {
                    q += $[F++] << Z;
                    Z += 8;
                    q += $[F++] << Z;
                    Z += 8
                }
                I = Y[q & z];
                C: for (; ; ) {
                    _ = I >>> 24;
                    q >>>= _;
                    Z -= _;
                    _ = I >>> 16 & 255;
                    if (_ === 0)
                        R[s++] = I & 65535;
                    else if (_ & 16) {
                        J = I & 65535;
                        _ &= 15;
                        if (_) {
                            if (Z < _) {
                                q += $[F++] << Z;
                                Z += 8
                            }
                            J += q & (1 << _) - 1;
                            q >>>= _;
                            Z -= _
                        }
                        if (Z < 15) {
                            q += $[F++] << Z;
                            Z += 8;
                            q += $[F++] << Z;
                            Z += 8
                        }
                        I = S[q & Q];
                        g: for (; ; ) {
                            _ = I >>> 24;
                            q >>>= _;
                            Z -= _;
                            _ = I >>> 16 & 255;
                            if (_ & 16) {
                                n = I & 65535;
                                _ &= 15;
                                if (Z < _) {
                                    q += $[F++] << Z;
                                    Z += 8;
                                    if (Z < _) {
                                        q += $[F++] << Z;
                                        Z += 8
                                    }
                                }
                                n += q & (1 << _) - 1;
                                if (n > O) {
                                    C.msg = "invalid distance too far back";
                                    V.mode = E;
                                    break y
                                }
                                q >>>= _;
                                Z -= _;
                                _ = s - u;
                                if (n > _) {
                                    _ = n - _;
                                    if (_ > P)
                                        if (V.sane) {
                                            C.msg = "invalid distance too far back";
                                            V.mode = E;
                                            break y
                                        }
                                    r = 0;
                                    j = A;
                                    if (o === 0) {
                                        r += d - _;
                                        if (_ < J) {
                                            J -= _;
                                            do {
                                                R[s++] = A[r++]
                                            } while (--_);
                                            r = s - n;
                                            j = R
                                        }
                                    } else if (o < _) {
                                        r += d + o - _;
                                        _ -= o;
                                        if (_ < J) {
                                            J -= _;
                                            do {
                                                R[s++] = A[r++]
                                            } while (--_);
                                            r = 0;
                                            if (o < J) {
                                                _ = o;
                                                J -= _;
                                                do {
                                                    R[s++] = A[r++]
                                                } while (--_);
                                                r = s - n;
                                                j = R
                                            }
                                        }
                                    } else {
                                        r += o - _;
                                        if (_ < J) {
                                            J -= _;
                                            do {
                                                R[s++] = A[r++]
                                            } while (--_);
                                            r = s - n;
                                            j = R
                                        }
                                    }
                                    while (J > 2) {
                                        R[s++] = j[r++];
                                        R[s++] = j[r++];
                                        R[s++] = j[r++];
                                        J -= 3
                                    }
                                    if (J) {
                                        R[s++] = j[r++];
                                        if (J > 1)
                                            R[s++] = j[r++]
                                    }
                                } else {
                                    r = s - n;
                                    do {
                                        R[s++] = R[r++];
                                        R[s++] = R[r++];
                                        R[s++] = R[r++];
                                        J -= 3
                                    } while (J > 2);
                                    if (J) {
                                        R[s++] = R[r++];
                                        if (J > 1)
                                            R[s++] = R[r++]
                                    }
                                }
                            } else if ((_ & 64) === 0) {
                                I = S[(I & 65535) + (q & (1 << _) - 1)];
                                continue g
                            } else {
                                C.msg = "invalid distance code";
                                V.mode = E;
                                break y
                            }
                            break
                        }
                    } else if ((_ & 64) === 0) {
                        I = Y[(I & 65535) + (q & (1 << _) - 1)];
                        continue C
                    } else if (_ & 32) {
                        V.mode = B;
                        break y
                    } else {
                        C.msg = "invalid literal/length code";
                        V.mode = E;
                        break y
                    }
                    break
                }
            } while (F < H && s < L);
            J = Z >> 3;
            F -= J;
            Z -= J << 3;
            q &= (1 << Z) - 1;
            C.next_in = F;
            C.next_out = s;
            C.avail_in = F < H ? 5 + (H - F) : 5 - (F - H);
            C.avail_out = s < L ? 257 + (L - s) : 257 - (s - L);
            V.hold = q;
            V.bits = Z;
            return
        }, v = 15, i = 852, a = 592, b = 0, X = 1, f = 2, m = new Uint16Array([3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31, 35, 43, 51, 59, 67, 83, 99, 115, 131, 163, 195, 227, 258, 0, 0]), ys = new Uint8Array([16, 16, 16, 16, 16, 16, 16, 16, 17, 17, 17, 17, 18, 18, 18, 18, 19, 19, 19, 19, 20, 20, 20, 20, 21, 21, 21, 21, 16, 72, 78]), Cs = new Uint16Array([1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193, 257, 385, 513, 769, 1025, 1537, 2049, 3073, 4097, 6145, 8193, 12289, 16385, 24577, 0, 0]), gs = new Uint8Array([16, 16, 16, 16, 17, 17, 18, 18, 19, 19, 20, 20, 21, 21, 22, 22, 23, 23, 24, 24, 25, 25, 26, 26, 27, 27, 28, 28, 29, 29, 64, 64]), I, M = function y(C, g, F, H, s, u, L, O) {
            var d = O.bits;
            var P = 0;
            var o = 0;
            var A = 0
              , q = 0;
            var Z = 0;
            var Y = 0;
            var S = 0;
            var z = 0;
            var Q = 0;
            var I = 0;
            var _;
            var J;
            var n;
            var r;
            var j;
            var $ = null;
            var R;
            var V = new Uint16Array(v + 1);
            var E = new Uint16Array(v + 1);
            var B = null;
            var p, t, M;
            for (P = 0; P <= v; P++)
                V[P] = 0;
            for (o = 0; o < H; o++)
                V[g[F + o]]++;
            Z = d;
            for (q = v; q >= 1; q--)
                if (V[q] !== 0)
                    break;
            if (Z > q)
                Z = q;
            if (q === 0) {
                s[u++] = 1 << 24 | 64 << 16 | 0;
                s[u++] = 1 << 24 | 64 << 16 | 0;
                O.bits = 1;
                return 0
            }
            for (A = 1; A < q; A++)
                if (V[A] !== 0)
                    break;
            if (Z < A)
                Z = A;
            z = 1;
            for (P = 1; P <= v; P++) {
                z <<= 1;
                z -= V[P];
                if (z < 0)
                    return -1
            }
            if (z > 0 && (C === b || q !== 1))
                return -1;
            E[1] = 0;
            for (P = 1; P < v; P++)
                E[P + 1] = E[P] + V[P];
            for (o = 0; o < H; o++)
                if (g[F + o] !== 0)
                    L[E[g[F + o]]++] = o;
            if (C === b) {
                $ = B = L;
                R = 20
            } else if (C === X) {
                $ = m;
                B = ys;
                R = 257
            } else {
                $ = Cs;
                B = gs;
                R = 0
            }
            I = 0;
            o = 0;
            P = A;
            j = u;
            Y = Z;
            S = 0;
            n = -1;
            Q = 1 << Z;
            r = Q - 1;
            if (C === X && Q > i || C === f && Q > a)
                return 1;
            for (; ; ) {
                p = P - S;
                if (L[o] + 1 < R) {
                    t = 0;
                    M = L[o]
                } else if (L[o] >= R) {
                    t = B[L[o] - R];
                    M = $[L[o] - R]
                } else {
                    t = 32 + 64;
                    M = 0
                }
                _ = 1 << P - S;
                J = 1 << Y;
                A = J;
                do {
                    J -= _;
                    s[j + (I >> S) + J] = p << 24 | t << 16 | M | 0
                } while (J !== 0);
                _ = 1 << P - 1;
                while (I & _)
                    _ >>= 1;
                if (_ !== 0) {
                    I &= _ - 1;
                    I += _
                } else
                    I = 0;
                o++;
                if (--V[P] === 0) {
                    if (P === q)
                        break;
                    P = g[F + L[o]]
                }
                if (P > Z && (I & r) !== n) {
                    if (S === 0)
                        S = Z;
                    j += A;
                    Y = P - S;
                    z = 1 << Y;
                    while (Y + S < q) {
                        z -= V[Y + S];
                        if (z <= 0)
                            break;
                        Y++;
                        z <<= 1
                    }
                    Q += 1 << Y;
                    if (C === X && Q > i || C === f && Q > a)
                        return 1;
                    n = I & r;
                    s[n] = Z << 24 | Y << 16 | j - u | 0
                }
            }
            if (I !== 0)
                s[j + I] = P - S << 24 | 64 << 16 | 0;
            O.bits = Z;
            return 0
        }, C = {
            Z_NO_FLUSH: 0,
            Z_PARTIAL_FLUSH: 1,
            Z_SYNC_FLUSH: 2,
            Z_FULL_FLUSH: 3,
            Z_FINISH: 4,
            Z_BLOCK: 5,
            Z_TREES: 6,
            Z_OK: 0,
            Z_STREAM_END: 1,
            Z_NEED_DICT: 2,
            Z_ERRNO: -1,
            Z_STREAM_ERROR: -2,
            Z_DATA_ERROR: -3,
            Z_MEM_ERROR: -4,
            Z_BUF_ERROR: -5,
            Z_NO_COMPRESSION: 0,
            Z_BEST_SPEED: 1,
            Z_BEST_COMPRESSION: 9,
            Z_DEFAULT_COMPRESSION: -1,
            Z_FILTERED: 1,
            Z_HUFFMAN_ONLY: 2,
            Z_RLE: 3,
            Z_FIXED: 4,
            Z_DEFAULT_STRATEGY: 0,
            Z_BINARY: 0,
            Z_TEXT: 1,
            Z_UNKNOWN: 2,
            Z_DEFLATED: 8
        }, Fs = 0, Hs = 1, ss = 2, us = C.Z_FINISH, Ls = C.Z_BLOCK, D = C.Z_TREES, T = C.Z_OK, Os = C.Z_STREAM_END, ds = C.Z_NEED_DICT, U = C.Z_STREAM_ERROR, Ps = C.Z_DATA_ERROR, os = C.Z_MEM_ERROR, As = C.Z_BUF_ERROR, qs = C.Z_DEFLATED, w = 16180, Zs = 16181, Ys = 16182, Ss = 16183, zs = 16184, Qs = 16185, Is = 16186, _s = 16187, Js = 16188, ns = 16189, G = 16190, W = 16191, N = 16192, rs = 16193, h = 16194, js = 16195, $s = 16196, Rs = 16197, Vs = 16198, c = 16199, e = 16200, Es = 16201, Bs = 16202, ps = 16203, ts = 16204, Ms = 16205, l = 16206, vs = 16207, is = 16208, x = 16209, as = 16210, Xs = 16211, _ = 852, J = 592, n, r = 15, Ds = function y(C) {
            return (C >>> 24 & 255) + (C >>> 8 & 65280) + ((C & 65280) << 8) + ((C & 255) << 24)
        };
        function j() {
            this.strm = null;
            this.mode = 0;
            this.last = false;
            this.wrap = 0;
            this.havedict = false;
            this.flags = 0;
            this.dmax = 0;
            this.check = 0;
            this.total = 0;
            this.head = null;
            this.wbits = 0;
            this.wsize = 0;
            this.whave = 0;
            this.wnext = 0;
            this.window = null;
            this.hold = 0;
            this.bits = 0;
            this.length = 0;
            this.offset = 0;
            this.extra = 0;
            this.lencode = null;
            this.distcode = null;
            this.lenbits = 0;
            this.distbits = 0;
            this.ncode = 0;
            this.nlen = 0;
            this.ndist = 0;
            this.have = 0;
            this.next = null;
            this.lens = new Uint16Array(320);
            this.work = new Uint16Array(288);
            this.lendyn = null;
            this.distdyn = null;
            this.sane = 0;
            this.back = 0;
            this.was = 0
        }
        var k = function y(C) {
            if (!C)
                return 1;
            var g = C.state;
            if (!g || g.strm !== C || g.mode < w || g.mode > Xs)
                return 1;
            return 0
        }, $ = function y(C) {
            if (k(C))
                return U;
            var g = C.state;
            C.total_in = C.total_out = g.total = 0;
            C.msg = "";
            if (g.wrap)
                C.adler = g.wrap & 1;
            g.mode = w;
            g.last = 0;
            g.havedict = 0;
            g.flags = -1;
            g.dmax = 32768;
            g.head = null;
            g.hold = 0;
            g.bits = 0;
            g.lencode = g.lendyn = new Int32Array(_);
            g.distcode = g.distdyn = new Int32Array(J);
            g.sane = 1;
            g.back = -1;
            return T
        }, R = function y(C) {
            if (k(C))
                return U;
            var g = C.state;
            g.wsize = 0;
            g.whave = 0;
            g.wnext = 0;
            return $(C)
        }, V = function y(C, g) {
            var F;
            if (k(C))
                return U;
            var H = C.state;
            if (g < 0) {
                F = 0;
                g = -g
            } else {
                F = (g >> 4) + 5;
                if (g < 48)
                    g &= 15
            }
            if (g && (g < 8 || g > 15))
                return U;
            if (H.window !== null && H.wbits !== g)
                H.window = null;
            H.wrap = F;
            H.wbits = g;
            return R(C)
        }, Ts = function y(C, g) {
            if (!C)
                return U;
            var F = new j;
            C.state = F;
            F.strm = C;
            F.window = null;
            F.mode = w;
            var H = V(C, g);
            if (H !== T)
                C.state = null;
            return H
        }, Us, ws = true, F, H, Gs = function y(C) {
            if (ws) {
                F = new Int32Array(512);
                H = new Int32Array(32);
                var g = 0;
                while (g < 144)
                    C.lens[g++] = 8;
                while (g < 256)
                    C.lens[g++] = 9;
                while (g < 280)
                    C.lens[g++] = 7;
                while (g < 288)
                    C.lens[g++] = 8;
                M(Hs, C.lens, 0, 288, F, 0, C.work, {
                    bits: 9
                });
                g = 0;
                while (g < 32)
                    C.lens[g++] = 5;
                M(ss, C.lens, 0, 32, H, 0, C.work, {
                    bits: 5
                });
                ws = false
            }
            C.lencode = F;
            C.lenbits = 9;
            C.distcode = H;
            C.distbits = 5
        }, Ws = function y(C, g, F, H) {
            var s;
            var u = C.state;
            if (u.window === null) {
                u.wsize = 1 << u.wbits;
                u.wnext = 0;
                u.whave = 0;
                u.window = new Uint8Array(u.wsize)
            }
            if (H >= u.wsize) {
                u.window.set(g.subarray(F - u.wsize, F), 0);
                u.wnext = 0;
                u.whave = u.wsize
            } else {
                s = u.wsize - u.wnext;
                if (s > H)
                    s = H;
                u.window.set(g.subarray(F - H, F - H + s), u.wnext);
                H -= s;
                if (H) {
                    u.window.set(g.subarray(F - H, F), 0);
                    u.wnext = H;
                    u.whave = u.wsize
                } else {
                    u.wnext += s;
                    if (u.wnext === u.wsize)
                        u.wnext = 0;
                    if (u.whave < u.wsize)
                        u.whave += s
                }
            }
            return 0
        }, Ns, hs, cs, es, ls, xs, ks, Ks, bs, fs, ms, y3, C3, g3, o = {
            inflateReset: R,
            inflateReset2: V,
            inflateResetKeep: $,
            inflateInit: function y(C) {
                return Ts(C, r)
            },
            inflateInit2: Ts,
            inflate: function y(C, g) {
                var F;
                var H, s;
                var u;
                var L;
                var O, d;
                var P;
                var o;
                var A, q;
                var Z;
                var Y;
                var S;
                var z = 0;
                var Q, I, _;
                var J, n, r;
                var j;
                var $;
                var R = new Uint8Array(4);
                var V;
                var E;
                var B = new Uint8Array([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]);
                if (k(C) || !C.output || !C.input && C.avail_in !== 0)
                    return U;
                F = C.state;
                if (F.mode === W)
                    F.mode = N;
                L = C.next_out;
                s = C.output;
                d = C.avail_out;
                u = C.next_in;
                H = C.input;
                O = C.avail_in;
                P = F.hold;
                o = F.bits;
                A = O;
                q = d;
                $ = T;
                y: for (; ; )
                    switch (F.mode) {
                    case w:
                        if (F.wrap === 0) {
                            F.mode = N;
                            break
                        }
                        while (o < 16) {
                            if (O === 0)
                                break y;
                            O--;
                            P += H[u++] << o;
                            o += 8
                        }
                        if (F.wrap & 2 && P === 35615) {
                            if (F.wbits === 0)
                                F.wbits = 15;
                            F.check = 0;
                            R[0] = P & 255;
                            R[1] = P >>> 8 & 255;
                            F.check = t(F.check, R, 2, 0);
                            P = 0;
                            o = 0;
                            F.mode = Zs;
                            break
                        }
                        if (F.head)
                            F.head.done = false;
                        if (!(F.wrap & 1) || (((P & 255) << 8) + (P >> 8)) % 31) {
                            C.msg = "incorrect header check";
                            F.mode = x;
                            break
                        }
                        if ((P & 15) !== qs) {
                            C.msg = "unknown compression method";
                            F.mode = x;
                            break
                        }
                        P >>>= 4;
                        o -= 4;
                        j = (P & 15) + 8;
                        if (F.wbits === 0)
                            F.wbits = j;
                        if (j > 15 || j > F.wbits) {
                            C.msg = "invalid window size";
                            F.mode = x;
                            break
                        }
                        F.dmax = 1 << F.wbits;
                        F.flags = 0;
                        C.adler = F.check = 1;
                        F.mode = P & 512 ? ns : W;
                        P = 0;
                        o = 0;
                        break;
                    case Zs:
                        while (o < 16) {
                            if (O === 0)
                                break y;
                            O--;
                            P += H[u++] << o;
                            o += 8
                        }
                        F.flags = P;
                        if ((F.flags & 255) !== qs) {
                            C.msg = "unknown compression method";
                            F.mode = x;
                            break
                        }
                        if (F.flags & 57344) {
                            C.msg = "unknown header flags set";
                            F.mode = x;
                            break
                        }
                        if (F.head)
                            F.head.text = P >> 8 & 1;
                        if (F.flags & 512 && F.wrap & 4) {
                            R[0] = P & 255;
                            R[1] = P >>> 8 & 255;
                            F.check = t(F.check, R, 2, 0)
                        }
                        P = 0;
                        o = 0;
                        F.mode = Ys;
                    case Ys:
                        while (o < 32) {
                            if (O === 0)
                                break y;
                            O--;
                            P += H[u++] << o;
                            o += 8
                        }
                        if (F.head)
                            F.head.time = P;
                        if (F.flags & 512 && F.wrap & 4) {
                            R[0] = P & 255;
                            R[1] = P >>> 8 & 255;
                            R[2] = P >>> 16 & 255;
                            R[3] = P >>> 24 & 255;
                            F.check = t(F.check, R, 4, 0)
                        }
                        P = 0;
                        o = 0;
                        F.mode = Ss;
                    case Ss:
                        while (o < 16) {
                            if (O === 0)
                                break y;
                            O--;
                            P += H[u++] << o;
                            o += 8
                        }
                        if (F.head) {
                            F.head.xflags = P & 255;
                            F.head.os = P >> 8
                        }
                        if (F.flags & 512 && F.wrap & 4) {
                            R[0] = P & 255;
                            R[1] = P >>> 8 & 255;
                            F.check = t(F.check, R, 2, 0)
                        }
                        P = 0;
                        o = 0;
                        F.mode = zs;
                    case zs:
                        if (F.flags & 1024) {
                            while (o < 16) {
                                if (O === 0)
                                    break y;
                                O--;
                                P += H[u++] << o;
                                o += 8
                            }
                            F.length = P;
                            if (F.head)
                                F.head.extra_len = P;
                            if (F.flags & 512 && F.wrap & 4) {
                                R[0] = P & 255;
                                R[1] = P >>> 8 & 255;
                                F.check = t(F.check, R, 2, 0)
                            }
                            P = 0;
                            o = 0
                        } else if (F.head)
                            F.head.extra = null;
                        F.mode = Qs;
                    case Qs:
                        if (F.flags & 1024) {
                            Z = F.length;
                            if (Z > O)
                                Z = O;
                            if (Z) {
                                if (F.head) {
                                    j = F.head.extra_len - F.length;
                                    if (!F.head.extra)
                                        F.head.extra = new Uint8Array(F.head.extra_len);
                                    F.head.extra.set(H.subarray(u, u + Z), j)
                                }
                                if (F.flags & 512 && F.wrap & 4)
                                    F.check = t(F.check, H, Z, u);
                                O -= Z;
                                u += Z;
                                F.length -= Z
                            }
                            if (F.length)
                                break y
                        }
                        F.length = 0;
                        F.mode = Is;
                    case Is:
                        if (F.flags & 2048) {
                            if (O === 0)
                                break y;
                            Z = 0;
                            do {
                                j = H[u + Z++];
                                if (F.head && j && F.length < 65536)
                                    F.head.name += String.fromCharCode(j)
                            } while (j && Z < O);
                            if (F.flags & 512 && F.wrap & 4)
                                F.check = t(F.check, H, Z, u);
                            O -= Z;
                            u += Z;
                            if (j)
                                break y
                        } else if (F.head)
                            F.head.name = null;
                        F.length = 0;
                        F.mode = _s;
                    case _s:
                        if (F.flags & 4096) {
                            if (O === 0)
                                break y;
                            Z = 0;
                            do {
                                j = H[u + Z++];
                                if (F.head && j && F.length < 65536)
                                    F.head.comment += String.fromCharCode(j)
                            } while (j && Z < O);
                            if (F.flags & 512 && F.wrap & 4)
                                F.check = t(F.check, H, Z, u);
                            O -= Z;
                            u += Z;
                            if (j)
                                break y
                        } else if (F.head)
                            F.head.comment = null;
                        F.mode = Js;
                    case Js:
                        if (F.flags & 512) {
                            while (o < 16) {
                                if (O === 0)
                                    break y;
                                O--;
                                P += H[u++] << o;
                                o += 8
                            }
                            if (F.wrap & 4 && P !== (F.check & 65535)) {
                                C.msg = "header crc mismatch";
                                F.mode = x;
                                break
                            }
                            P = 0;
                            o = 0
                        }
                        if (F.head) {
                            F.head.hcrc = F.flags >> 9 & 1;
                            F.head.done = true
                        }
                        C.adler = F.check = 0;
                        F.mode = W;
                        break;
                    case ns:
                        while (o < 32) {
                            if (O === 0)
                                break y;
                            O--;
                            P += H[u++] << o;
                            o += 8
                        }
                        C.adler = F.check = Ds(P);
                        P = 0;
                        o = 0;
                        F.mode = G;
                    case G:
                        if (F.havedict === 0) {
                            C.next_out = L;
                            C.avail_out = d;
                            C.next_in = u;
                            C.avail_in = O;
                            F.hold = P;
                            F.bits = o;
                            return ds
                        }
                        C.adler = F.check = 1;
                        F.mode = W;
                    case W:
                        if (g === Ls || g === D)
                            break y;
                    case N:
                        if (F.last) {
                            P >>>= o & 7;
                            o -= o & 7;
                            F.mode = l;
                            break
                        }
                        while (o < 3) {
                            if (O === 0)
                                break y;
                            O--;
                            P += H[u++] << o;
                            o += 8
                        }
                        F.last = P & 1;
                        P >>>= 1;
                        o -= 1;
                        switch (P & 3) {
                        case 0:
                            F.mode = rs;
                            break;
                        case 1:
                            Gs(F);
                            F.mode = c;
                            if (g === D) {
                                P >>>= 2;
                                o -= 2;
                                break y
                            }
                            break;
                        case 2:
                            F.mode = $s;
                            break;
                        case 3:
                            C.msg = "invalid block type";
                            F.mode = x
                        }
                        P >>>= 2;
                        o -= 2;
                        break;
                    case rs:
                        P >>>= o & 7;
                        o -= o & 7;
                        while (o < 32) {
                            if (O === 0)
                                break y;
                            O--;
                            P += H[u++] << o;
                            o += 8
                        }
                        if ((P & 65535) !== (P >>> 16 ^ 65535)) {
                            C.msg = "invalid stored block lengths";
                            F.mode = x;
                            break
                        }
                        F.length = P & 65535;
                        P = 0;
                        o = 0;
                        F.mode = h;
                        if (g === D)
                            break y;
                    case h:
                        F.mode = js;
                    case js:
                        Z = F.length;
                        if (Z) {
                            if (Z > O)
                                Z = O;
                            if (Z > d)
                                Z = d;
                            if (Z === 0)
                                break y;
                            s.set(H.subarray(u, u + Z), L);
                            O -= Z;
                            u += Z;
                            d -= Z;
                            L += Z;
                            F.length -= Z;
                            break
                        }
                        F.mode = W;
                        break;
                    case $s:
                        while (o < 14) {
                            if (O === 0)
                                break y;
                            O--;
                            P += H[u++] << o;
                            o += 8
                        }
                        F.nlen = (P & 31) + 257;
                        P >>>= 5;
                        o -= 5;
                        F.ndist = (P & 31) + 1;
                        P >>>= 5;
                        o -= 5;
                        F.ncode = (P & 15) + 4;
                        P >>>= 4;
                        o -= 4;
                        if (F.nlen > 286 || F.ndist > 30) {
                            C.msg = "too many length or distance symbols";
                            F.mode = x;
                            break
                        }
                        F.have = 0;
                        F.mode = Rs;
                    case Rs:
                        while (F.have < F.ncode) {
                            while (o < 3) {
                                if (O === 0)
                                    break y;
                                O--;
                                P += H[u++] << o;
                                o += 8
                            }
                            F.lens[B[F.have++]] = P & 7;
                            P >>>= 3;
                            o -= 3
                        }
                        while (F.have < 19)
                            F.lens[B[F.have++]] = 0;
                        F.lencode = F.lendyn;
                        F.lenbits = 7;
                        V = {
                            bits: F.lenbits
                        };
                        $ = M(Fs, F.lens, 0, 19, F.lencode, 0, F.work, V);
                        F.lenbits = V.bits;
                        if ($) {
                            C.msg = "invalid code lengths set";
                            F.mode = x;
                            break
                        }
                        F.have = 0;
                        F.mode = Vs;
                    case Vs:
                        while (F.have < F.nlen + F.ndist) {
                            for (; ; ) {
                                z = F.lencode[P & (1 << F.lenbits) - 1];
                                Q = z >>> 24;
                                I = z >>> 16 & 255;
                                _ = z & 65535;
                                if (Q <= o)
                                    break;
                                if (O === 0)
                                    break y;
                                O--;
                                P += H[u++] << o;
                                o += 8
                            }
                            if (_ < 16) {
                                P >>>= Q;
                                o -= Q;
                                F.lens[F.have++] = _
                            } else {
                                if (_ === 16) {
                                    E = Q + 2;
                                    while (o < E) {
                                        if (O === 0)
                                            break y;
                                        O--;
                                        P += H[u++] << o;
                                        o += 8
                                    }
                                    P >>>= Q;
                                    o -= Q;
                                    if (F.have === 0) {
                                        C.msg = "invalid bit length repeat";
                                        F.mode = x;
                                        break
                                    }
                                    j = F.lens[F.have - 1];
                                    Z = 3 + (P & 3);
                                    P >>>= 2;
                                    o -= 2
                                } else if (_ === 17) {
                                    E = Q + 3;
                                    while (o < E) {
                                        if (O === 0)
                                            break y;
                                        O--;
                                        P += H[u++] << o;
                                        o += 8
                                    }
                                    P >>>= Q;
                                    o -= Q;
                                    j = 0;
                                    Z = 3 + (P & 7);
                                    P >>>= 3;
                                    o -= 3
                                } else {
                                    E = Q + 7;
                                    while (o < E) {
                                        if (O === 0)
                                            break y;
                                        O--;
                                        P += H[u++] << o;
                                        o += 8
                                    }
                                    P >>>= Q;
                                    o -= Q;
                                    j = 0;
                                    Z = 11 + (P & 127);
                                    P >>>= 7;
                                    o -= 7
                                }
                                if (F.have + Z > F.nlen + F.ndist) {
                                    C.msg = "invalid bit length repeat";
                                    F.mode = x;
                                    break
                                }
                                while (Z--)
                                    F.lens[F.have++] = j
                            }
                        }
                        if (F.mode === x)
                            break;
                        if (F.lens[256] === 0) {
                            C.msg = "invalid code -- missing end-of-block";
                            F.mode = x;
                            break
                        }
                        F.lenbits = 9;
                        V = {
                            bits: F.lenbits
                        };
                        $ = M(Hs, F.lens, 0, F.nlen, F.lencode, 0, F.work, V);
                        F.lenbits = V.bits;
                        if ($) {
                            C.msg = "invalid literal/lengths set";
                            F.mode = x;
                            break
                        }
                        F.distbits = 6;
                        F.distcode = F.distdyn;
                        V = {
                            bits: F.distbits
                        };
                        $ = M(ss, F.lens, F.nlen, F.ndist, F.distcode, 0, F.work, V);
                        F.distbits = V.bits;
                        if ($) {
                            C.msg = "invalid distances set";
                            F.mode = x;
                            break
                        }
                        F.mode = c;
                        if (g === D)
                            break y;
                    case c:
                        F.mode = e;
                    case e:
                        if (O >= 6 && d >= 258) {
                            C.next_out = L;
                            C.avail_out = d;
                            C.next_in = u;
                            C.avail_in = O;
                            F.hold = P;
                            F.bits = o;
                            K(C, q);
                            L = C.next_out;
                            s = C.output;
                            d = C.avail_out;
                            u = C.next_in;
                            H = C.input;
                            O = C.avail_in;
                            P = F.hold;
                            o = F.bits;
                            if (F.mode === W)
                                F.back = -1;
                            break
                        }
                        F.back = 0;
                        for (; ; ) {
                            z = F.lencode[P & (1 << F.lenbits) - 1];
                            Q = z >>> 24;
                            I = z >>> 16 & 255;
                            _ = z & 65535;
                            if (Q <= o)
                                break;
                            if (O === 0)
                                break y;
                            O--;
                            P += H[u++] << o;
                            o += 8
                        }
                        if (I && (I & 240) === 0) {
                            J = Q;
                            n = I;
                            r = _;
                            for (; ; ) {
                                z = F.lencode[r + ((P & (1 << J + n) - 1) >> J)];
                                Q = z >>> 24;
                                I = z >>> 16 & 255;
                                _ = z & 65535;
                                if (J + Q <= o)
                                    break;
                                if (O === 0)
                                    break y;
                                O--;
                                P += H[u++] << o;
                                o += 8
                            }
                            P >>>= J;
                            o -= J;
                            F.back += J
                        }
                        P >>>= Q;
                        o -= Q;
                        F.back += Q;
                        F.length = _;
                        if (I === 0) {
                            F.mode = Ms;
                            break
                        }
                        if (I & 32) {
                            F.back = -1;
                            F.mode = W;
                            break
                        }
                        if (I & 64) {
                            C.msg = "invalid literal/length code";
                            F.mode = x;
                            break
                        }
                        F.extra = I & 15;
                        F.mode = Es;
                    case Es:
                        if (F.extra) {
                            E = F.extra;
                            while (o < E) {
                                if (O === 0)
                                    break y;
                                O--;
                                P += H[u++] << o;
                                o += 8
                            }
                            F.length += P & (1 << F.extra) - 1;
                            P >>>= F.extra;
                            o -= F.extra;
                            F.back += F.extra
                        }
                        F.was = F.length;
                        F.mode = Bs;
                    case Bs:
                        for (; ; ) {
                            z = F.distcode[P & (1 << F.distbits) - 1];
                            Q = z >>> 24;
                            I = z >>> 16 & 255;
                            _ = z & 65535;
                            if (Q <= o)
                                break;
                            if (O === 0)
                                break y;
                            O--;
                            P += H[u++] << o;
                            o += 8
                        }
                        if ((I & 240) === 0) {
                            J = Q;
                            n = I;
                            r = _;
                            for (; ; ) {
                                z = F.distcode[r + ((P & (1 << J + n) - 1) >> J)];
                                Q = z >>> 24;
                                I = z >>> 16 & 255;
                                _ = z & 65535;
                                if (J + Q <= o)
                                    break;
                                if (O === 0)
                                    break y;
                                O--;
                                P += H[u++] << o;
                                o += 8
                            }
                            P >>>= J;
                            o -= J;
                            F.back += J
                        }
                        P >>>= Q;
                        o -= Q;
                        F.back += Q;
                        if (I & 64) {
                            C.msg = "invalid distance code";
                            F.mode = x;
                            break
                        }
                        F.offset = _;
                        F.extra = I & 15;
                        F.mode = ps;
                    case ps:
                        if (F.extra) {
                            E = F.extra;
                            while (o < E) {
                                if (O === 0)
                                    break y;
                                O--;
                                P += H[u++] << o;
                                o += 8
                            }
                            F.offset += P & (1 << F.extra) - 1;
                            P >>>= F.extra;
                            o -= F.extra;
                            F.back += F.extra
                        }
                        if (F.offset > F.dmax) {
                            C.msg = "invalid distance too far back";
                            F.mode = x;
                            break
                        }
                        F.mode = ts;
                    case ts:
                        if (d === 0)
                            break y;
                        Z = q - d;
                        if (F.offset > Z) {
                            Z = F.offset - Z;
                            if (Z > F.whave)
                                if (F.sane) {
                                    C.msg = "invalid distance too far back";
                                    F.mode = x;
                                    break
                                }
                            if (Z > F.wnext) {
                                Z -= F.wnext;
                                Y = F.wsize - Z
                            } else
                                Y = F.wnext - Z;
                            if (Z > F.length)
                                Z = F.length;
                            S = F.window
                        } else {
                            S = s;
                            Y = L - F.offset;
                            Z = F.length
                        }
                        if (Z > d)
                            Z = d;
                        d -= Z;
                        F.length -= Z;
                        do {
                            s[L++] = S[Y++]
                        } while (--Z);
                        if (F.length === 0)
                            F.mode = e;
                        break;
                    case Ms:
                        if (d === 0)
                            break y;
                        s[L++] = F.length;
                        d--;
                        F.mode = e;
                        break;
                    case l:
                        if (F.wrap) {
                            while (o < 32) {
                                if (O === 0)
                                    break y;
                                O--;
                                P |= H[u++] << o;
                                o += 8
                            }
                            q -= d;
                            C.total_out += q;
                            F.total += q;
                            if (F.wrap & 4 && q)
                                C.adler = F.check = F.flags ? t(F.check, s, q, L - q) : p(F.check, s, q, L - q);
                            q = d;
                            if (F.wrap & 4 && (F.flags ? P : Ds(P)) !== F.check) {
                                C.msg = "incorrect data check";
                                F.mode = x;
                                break
                            }
                            P = 0;
                            o = 0
                        }
                        F.mode = vs;
                    case vs:
                        if (F.wrap && F.flags) {
                            while (o < 32) {
                                if (O === 0)
                                    break y;
                                O--;
                                P += H[u++] << o;
                                o += 8
                            }
                            if (F.wrap & 4 && P !== (F.total & 4294967295)) {
                                C.msg = "incorrect length check";
                                F.mode = x;
                                break
                            }
                            P = 0;
                            o = 0
                        }
                        F.mode = is;
                    case is:
                        $ = Os;
                        break y;
                    case x:
                        $ = Ps;
                        break y;
                    case as:
                        return os;
                    case Xs:
                    default:
                        return U
                    }
                C.next_out = L;
                C.avail_out = d;
                C.next_in = u;
                C.avail_in = O;
                F.hold = P;
                F.bits = o;
                if (F.wsize || q !== C.avail_out && F.mode < x && (F.mode < l || g !== us))
                    if (Ws(C, C.output, C.next_out, q - C.avail_out))
                        ;A -= C.avail_in;
                q -= C.avail_out;
                C.total_in += A;
                C.total_out += q;
                F.total += q;
                if (F.wrap & 4 && q)
                    C.adler = F.check = F.flags ? t(F.check, s, q, C.next_out - q) : p(F.check, s, q, C.next_out - q);
                C.data_type = F.bits + (F.last ? 64 : 0) + (F.mode === W ? 128 : 0) + (F.mode === c || F.mode === h ? 256 : 0);
                if ((A === 0 && q === 0 || g === us) && $ === T)
                    $ = As;
                return $
            },
            inflateEnd: function y(C) {
                if (k(C))
                    return U;
                var g = C.state;
                if (g.window)
                    g.window = null;
                C.state = null;
                return T
            },
            inflateGetHeader: function y(C, g) {
                if (k(C))
                    return U;
                var F = C.state;
                if ((F.wrap & 2) === 0)
                    return U;
                F.head = g;
                g.done = false;
                return T
            },
            inflateSetDictionary: function y(C, g) {
                var F = g.length;
                var H;
                var s;
                var u;
                if (k(C))
                    return U;
                H = C.state;
                if (H.wrap !== 0 && H.mode !== G)
                    return U;
                if (H.mode === G) {
                    s = 1;
                    s = p(s, g, F, 0);
                    if (s !== H.check)
                        return Ps
                }
                u = Ws(C, g, F, F);
                if (u) {
                    H.mode = as;
                    return os
                }
                H.havedict = 1;
                return T
            },
            inflateInfo: "pako inflate (from Nodeca project)"
        };
        function s(y) {
            "@babel/helpers - typeof";
            return s = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(y) {
                return typeof y
            }
            : function(y) {
                return y && "function" == typeof Symbol && y.constructor === Symbol && y !== Symbol.prototype ? "symbol" : typeof y
            }
            ,
            s(y)
        }
        var F3 = function y(C, g) {
            return B3.prototype.hasOwnProperty.call(C, g)
        }, H3, s3, u3 = {
            assign: function y(C) {
                var g = Array.prototype.slice.call(arguments, 1);
                while (g.length) {
                    var F = g.shift();
                    if (!F)
                        continue;
                    if (s(F) !== "object")
                        throw new TypeError(F + "must be non-object");
                    for (var H in F)
                        if (F3(F, H))
                            C[H] = F[H]
                }
                return C
            },
            flattenChunks: function y(C) {
                var g = 0;
                for (var F = 0, H = C.length; F < H; F++)
                    g += C[F].length;
                var s = new Uint8Array(g);
                for (var u = 0, L = 0, O = C.length; u < O; u++) {
                    var d = C[u];
                    s.set(d, L);
                    L += d.length
                }
                return s
            }
        }, L3 = true;
        try {
            String.fromCharCode.apply(null, new Uint8Array(1))
        } catch (y) {
            L3 = false
        }
        for (var d = new Uint8Array(256), g = 0; g < 256; g++)
            d[g] = g >= 252 ? 6 : g >= 248 ? 5 : g >= 240 ? 4 : g >= 224 ? 3 : g >= 192 ? 2 : 1;
        d[254] = d[254] = 1;
        var O3, d3 = function y(C, g) {
            if (g < 65534)
                if (C.subarray && L3)
                    return String.fromCharCode.apply(null, C.length === g ? C : C.subarray(0, g));
            var F = "";
            for (var H = 0; H < g; H++)
                F += String.fromCharCode(C[H]);
            return F
        }, P3, o3, A = {
            string2buf: function y(C) {
                if (typeof TextEncoder === "function" && TextEncoder.prototype.encode)
                    return (new TextEncoder).encode(C);
                var g, F, H, s, u, L = C.length, O = 0;
                for (s = 0; s < L; s++) {
                    F = C.charCodeAt(s);
                    if ((F & 64512) === 55296 && s + 1 < L) {
                        H = C.charCodeAt(s + 1);
                        if ((H & 64512) === 56320) {
                            F = 65536 + (F - 55296 << 10) + (H - 56320);
                            s++
                        }
                    }
                    O += F < 128 ? 1 : F < 2048 ? 2 : F < 65536 ? 3 : 4
                }
                g = new Uint8Array(O);
                for (u = 0,
                s = 0; u < O; s++) {
                    F = C.charCodeAt(s);
                    if ((F & 64512) === 55296 && s + 1 < L) {
                        H = C.charCodeAt(s + 1);
                        if ((H & 64512) === 56320) {
                            F = 65536 + (F - 55296 << 10) + (H - 56320);
                            s++
                        }
                    }
                    if (F < 128)
                        g[u++] = F;
                    else if (F < 2048) {
                        g[u++] = 192 | F >>> 6;
                        g[u++] = 128 | F & 63
                    } else if (F < 65536) {
                        g[u++] = 224 | F >>> 12;
                        g[u++] = 128 | F >>> 6 & 63;
                        g[u++] = 128 | F & 63
                    } else {
                        g[u++] = 240 | F >>> 18;
                        g[u++] = 128 | F >>> 12 & 63;
                        g[u++] = 128 | F >>> 6 & 63;
                        g[u++] = 128 | F & 63
                    }
                }
                return g
            },
            buf2string: function y(C, g) {
                var F = g || C.length;
                if (typeof TextDecoder === "function" && TextDecoder.prototype.decode)
                    return (new TextDecoder).decode(C.subarray(0, g));
                var H, s;
                var u = new Array(F * 2);
                for (s = 0,
                H = 0; H < F; ) {
                    var L = C[H++];
                    if (L < 128) {
                        u[s++] = L;
                        continue
                    }
                    var O = d[L];
                    if (O > 4) {
                        u[s++] = 65533;
                        H += O - 1;
                        continue
                    }
                    L &= O === 2 ? 31 : O === 3 ? 15 : 7;
                    while (O > 1 && H < F) {
                        L = L << 6 | C[H++] & 63;
                        O--
                    }
                    if (O > 1) {
                        u[s++] = 65533;
                        continue
                    }
                    if (L < 65536)
                        u[s++] = L;
                    else {
                        L -= 65536;
                        u[s++] = 55296 | L >> 10 & 1023;
                        u[s++] = 56320 | L & 1023
                    }
                }
                return d3(u, s)
            },
            utf8border: function y(C, g) {
                g = g || C.length;
                if (g > C.length)
                    g = C.length;
                var F = g - 1;
                while (F >= 0 && (C[F] & 192) === 128)
                    F--;
                if (F < 0)
                    return g;
                if (F === 0)
                    return g;
                return F + d[C[F]] > g ? F : g
            }
        }, u = {
            2: "need dictionary",
            1: "stream end",
            0: "",
            "-1": "file error",
            "-2": "stream error",
            "-3": "data error",
            "-4": "insufficient memory",
            "-5": "buffer error",
            "-6": "incompatible version"
        };
        function A3() {
            this.input = null;
            this.next_in = 0;
            this.avail_in = 0;
            this.total_in = 0;
            this.output = null;
            this.next_out = 0;
            this.avail_out = 0;
            this.total_out = 0;
            this.msg = "";
            this.state = null;
            this.data_type = 2;
            this.adler = 0
        }
        var q3 = A3;
        function Z3() {
            this.text = 0;
            this.time = 0;
            this.xflags = 0;
            this.os = 0;
            this.extra = null;
            this.extra_len = 0;
            this.name = "";
            this.comment = "";
            this.hcrc = 0;
            this.done = false
        }
        var Y3 = Z3
          , S3 = B3.prototype.toString
          , z3 = C.Z_NO_FLUSH
          , Q3 = C.Z_FINISH
          , q = C.Z_OK
          , Z = C.Z_STREAM_END
          , Y = C.Z_NEED_DICT
          , I3 = C.Z_STREAM_ERROR
          , _3 = C.Z_DATA_ERROR
          , J3 = C.Z_MEM_ERROR;
        function L(y) {
            this.options = u3.assign({
                chunkSize: 1024 * 64,
                windowBits: 15,
                to: ""
            }, y || {});
            var C = this.options;
            if (C.raw && C.windowBits >= 0 && C.windowBits < 16) {
                C.windowBits = -C.windowBits;
                if (C.windowBits === 0)
                    C.windowBits = -15
            }
            if (C.windowBits >= 0 && C.windowBits < 16 && !(y && y.windowBits))
                C.windowBits += 32;
            if (C.windowBits > 15 && C.windowBits < 48)
                if ((C.windowBits & 15) === 0)
                    C.windowBits |= 15;
            this.err = 0;
            this.msg = "";
            this.ended = false;
            this.chunks = [];
            this.strm = new q3;
            this.strm.avail_out = 0;
            var g = o.inflateInit2(this.strm, C.windowBits);
            if (g !== q)
                throw new Error(u[g]);
            this.header = new Y3;
            o.inflateGetHeader(this.strm, this.header);
            if (C.dictionary) {
                if (typeof C.dictionary === "string")
                    C.dictionary = A.string2buf(C.dictionary);
                else if (S3.call(C.dictionary) === "[object ArrayBuffer]")
                    C.dictionary = new Uint8Array(C.dictionary);
                if (C.raw) {
                    g = o.inflateSetDictionary(this.strm, C.dictionary);
                    if (g !== q)
                        throw new Error(u[g])
                }
            }
        }
        function O(y, C) {
            var g = new L(C);
            g.push(y);
            if (g.err)
                throw g.msg || u[g.err];
            return g.result
        }
        function n3(y, C) {
            C = C || {};
            C.raw = true;
            return O(y, C)
        }
        L.prototype.push = function(y, C) {
            var g = this.strm;
            var F = this.options.chunkSize;
            var H = this.options.dictionary;
            var s, u, L;
            if (this.ended)
                return false;
            if (C === ~~C)
                u = C;
            else
                u = C === true ? Q3 : z3;
            if (S3.call(y) === "[object ArrayBuffer]")
                g.input = new Uint8Array(y);
            else
                g.input = y;
            g.next_in = 0;
            g.avail_in = g.input.length;
            for (; ; ) {
                if (g.avail_out === 0) {
                    g.output = new Uint8Array(F);
                    g.next_out = 0;
                    g.avail_out = F
                }
                s = o.inflate(g, u);
                if (s === Y && H) {
                    s = o.inflateSetDictionary(g, H);
                    if (s === q)
                        s = o.inflate(g, u);
                    else if (s === _3)
                        s = Y
                }
                while (g.avail_in > 0 && s === Z && g.state.wrap > 0 && y[g.next_in] !== 0) {
                    o.inflateReset(g);
                    s = o.inflate(g, u)
                }
                switch (s) {
                case I3:
                case _3:
                case Y:
                case J3:
                    this.onEnd(s);
                    this.ended = true;
                    return false
                }
                L = g.avail_out;
                if (g.next_out)
                    if (g.avail_out === 0 || s === Z)
                        if (this.options.to === "string") {
                            var O = A.utf8border(g.output, g.next_out);
                            var d = g.next_out - O;
                            var P = A.buf2string(g.output, O);
                            g.next_out = d;
                            g.avail_out = F - d;
                            if (d)
                                g.output.set(g.output.subarray(O, O + d), 0);
                            this.onData(P)
                        } else
                            this.onData(g.output.length === g.next_out ? g.output : g.output.subarray(0, g.next_out));
                if (s === q && L === 0)
                    continue;
                if (s === Z) {
                    s = o.inflateEnd(this.strm);
                    this.onEnd(s);
                    this.ended = true;
                    return true
                }
                if (g.avail_in === 0)
                    break
            }
            return true
        }
        ,
        L.prototype.onData = function(y) {
            this.chunks.push(y)
        }
        ,
        L.prototype.onEnd = function(y) {
            if (y === q)
                if (this.options.to === "string")
                    this.result = this.chunks.join("");
                else
                    this.result = u3.flattenChunks(this.chunks);
            this.chunks = [];
            this.err = y;
            this.msg = this.strm.msg
        }
        ;
        var r3, j3 = O, $3 = n3, R3 = O, V3 = C, E3 = {
            Inflate: L,
            inflate: j3,
            inflateRaw: $3,
            ungzip: R3,
            constants: V3
        };
        y.Inflate = L,
        y.constants = V3,
        y["default"] = E3,
        y.inflate = j3,
        y.inflateRaw = $3,
        y.ungzip = R3,
        B3.defineProperty(y, "__esModule", {
            value: true
        })
    }
    )((y = R).pako || (y.pako = {}));
    var _s, Js, ns, rs, L, _ = 2, V = 19, B = 10, p = 16, t = 8, M = 16, js = R.ht, J = R.pako, $s = null, y = Math, Rs = y.abs, Vs = y.max, Es = Number.MAX_VALUE, Bs = js.Default, ps = Bs.getInternal(), u = Bs.clone, O = ps.vec3TransformMat4, d = [0, 0], P = ps.appendArray, o = (ps.addMethod(Bs, {
        objDefaultValueRegexPattern: "( +[\\d|\\.|\\+|\\-|e|E]+| nan| [\\-]?inf| -nan\\(ind\\))"
    }, !0),
    y = Bs.objDefaultValueRegexPattern,
    _s = new RegExp("v" + y + y + y),
    Js = new RegExp("vt" + y + y),
    ns = new RegExp("vn" + y + y + y),
    rs = /^[og]\s*(.+)?/,
    L = function(y, C) {
        return 0 <= (C = parseInt(C)) ? y[C - 1] : y[C + y.length]
    }
    ,
    function(y, O, d) {
        if (!y)
            return $s;
        (ps.isString(O) || O instanceof ArrayBuffer) && (O = Xs(O)),
        (d = d || {}).flipY == $s && (d.flipY = !0);
        var C, g, F, X, H, s, u, L, P, o, D, A = d.model3d, T = (!A && (d.s3 || d.r3 || d.t3 || d.mat) && (d.matrix = ps.createWorldMatrix(d.mat, d.s3, d.r3, d.rotationMode, d.t3)),
        js.Style["wf.loadQuadWireframe"]), U = d.part, w = [], G = [], q = d.ignoreNormal ? $s : [], W = d.reverseFlipMtls, Z = {
            vs: [],
            uv: [],
            ns: q ? [] : $s
        }, Y = {
            htdefault: Z
        }, N = new is(y), h = [], c = "", e = "";
        for (q && d.matrix && (d.normalMatrix = ps.createNormalMatrix(d.matrix)); null != (C = N.stepNext()); )
            if (0 !== (C = C.trim()).length && "#" !== C.charAt(0))
                if (C.indexOf("\\") === C.length - 1)
                    c += C.substring(0, C.length - 1);
                else if (c && (C = c + C,
                c = ""),
                0 <= C.indexOf("#QNAN0") && (C = C.replace(/#QNAN0/gi, "0")),
                g = _s.exec(C))
                    w.push([parseFloat(g[1]), parseFloat(g[2]), parseFloat(g[3])]);
                else if (g = Js.exec(C))
                    G.push([parseFloat(g[1]), parseFloat(g[2])]);
                else if (q && (g = ns.exec(C)))
                    d.flipFace ? q.push([parseFloat(-g[1]), parseFloat(-g[2]), parseFloat(-g[3])]) : q.push([parseFloat(g[1]), parseFloat(g[2]), parseFloat(g[3])]);
                else if ("f" === C[0]) {
                    var l = C.split(/\s+/);
                    if (!(l.length < 4)) {
                        var S, z, x, Q = [], I = [], _ = [];
                        for (z = 1,
                        x = l.length; z < x; z++)
                            S = l[z].split("/"),
                            Q.push(parseInt(S[0], 10)),
                            1 < S.length && 0 < S[1].length && _.push(parseInt(S[1], 10)),
                            2 < S.length && 0 < S[2].length && I.push(parseInt(S[2], 10));
                        for (z = 0,
                        x = Q.length - 2; z < x; z++)
                            F = Z,
                            X = w,
                            H = G,
                            s = q,
                            u = d,
                            L = [Q[0], Q[z + 1], Q[z + 2]],
                            P = _.length ? [_[0], _[z + 1], _[z + 2]] : $s,
                            o = I.length ? [I[0], I[z + 1], I[z + 2]] : $s,
                            D = void 0,
                            D = s && s.length && o,
                            L[3] === Is ? (ts(F, X, u, L[0], L[1], L[2]),
                            P ? Ms(F, H, u, P[0], P[1], P[2]) : F.uv && F.uv.length && Ms(F, H, u),
                            D && vs(F, s, u, o[0], o[1], o[2])) : (ts(F, X, u, L[0], L[1], L[3]),
                            ts(F, X, u, L[1], L[2], L[3]),
                            P ? (Ms(F, H, u, P[0], P[1], P[3]),
                            Ms(F, H, u, P[1], P[2], P[3])) : F.uv && F.uv.length && (Ms(F, H, u),
                            Ms(F, H, u)),
                            D && (vs(F, s, u, o[0], o[1], o[3]),
                            vs(F, s, u, o[1], o[2], o[3])));
                        if (T) {
                            n = f = void 0;
                            for (var k = Z, K = w, b = d, J = Q, f = J.length - 1, n = 0; n < f; ++n)
                                Ds(k, K, b, J[n], J[n + 1]);
                            Ds(k, K, b, J[f], J[0])
                        }
                    }
                } else
                    U && null !== (g = rs.exec(C)) ? e = (" " + g[0].substr(1).trim()).substr(1) : /^usemtl /.test(C) && C.substring(7).trim().split(" ").forEach(function(y) {
                        var C = U ? e + "_" + y : y;
                        if (!(Z = Y[C])) {
                            Z = Y[C] = {
                                name: C,
                                vs: [],
                                uv: [],
                                ns: q ? [] : $s,
                                lvs: T ? [] : $s
                            },
                            U && A && (Z.mtlName = y,
                            Z.compName = e),
                            d.ignoreMtls && 0 <= d.ignoreMtls.indexOf(y) && delete Z.vs,
                            (d.reverseFlip || "*" === W || W && 0 <= W.indexOf(y)) && (Z.reverseFlip = !0);
                            var C = O
                              , g = Z
                              , F = d
                              , H = h;
                            if (C) {
                                C = C[y];
                                if (C)
                                    if (F.ignoreColor || (g.color = C.kd),
                                    !F.ignoreTransparent && 0 <= C.d && C.d < 1 && (g.transparent = !0,
                                    g.opacity = C.d),
                                    !F.ignoreImage && (s = C.map_kd)) {
                                        for (var s = s.split(" "), u = -1, L = 0; L < s.length; L++)
                                            "-o" === s[L] ? (g.uvOffset = [parseFloat(s[L + 1]), parseFloat(s[L + 2])],
                                            u = L += 3) : "-s" === s[L] && (g.uvScale = [parseFloat(s[L + 1]), parseFloat(s[L + 2])],
                                            u = L += 3);
                                        y = (s = s.slice(u + 1).join(" ")).match(/[^\\/]*$/)[0];
                                        H.indexOf(y) < 0 && H.push(y),
                                        F.assetsURIMap && F.assetsURIMap[y] ? g.image = F.assetsURIMap[y] : g.image = (F.prefix || "") + s
                                    }
                            }
                        }
                    });
        var m = [];
        for (Qs in Y) {
            var ys = Y[Qs]
              , Cs = ys.vs;
            if (Cs && 0 !== Cs.length) {
                var gs = ys.uv;
                if (gs)
                    for (var Fs = 2 * Cs.length / 3 - gs.length; 0 < Fs--; )
                        gs.push(0)
            } else
                m.push(Qs)
        }
        m.forEach(function(y) {
            delete Y[y]
        });
        var r, Hs, ss, us, j, $, Ls, R = Y, Os = A, ds = d.cube, y = d.center, Ps = d, V = Es, E = Es, B = Es, os = -Es, As = -Es, qs = -Es;
        for (r in R)
            for (i = (j = R[r].vs).length,
            a = 0; a < i; a += 3)
                (Hs = j[a + 0]) < V && (V = Hs),
                (ss = j[a + 1]) < E && (E = ss),
                (us = j[a + 2]) < B && (B = us),
                os < Hs && (os = Hs),
                As < ss && (As = ss),
                qs < us && (qs = us);
        if (y) {
            var Zs = V + (os - V) / 2
              , Ys = E + (As - E) / 2
              , Ss = B + (qs - B) / 2;
            if (!Os)
                for (r in R) {
                    for (i = (j = R[r].vs).length,
                    a = 0; a < i; a += 3)
                        j[a + 0] -= Zs,
                        j[a + 1] -= Ys,
                        j[a + 2] -= Ss;
                    if ($ = R[r].lvs)
                        for (i = $.length,
                        a = 0; a < i; a += 3)
                            $[a + 0] -= Zs,
                            $[a + 1] -= Ys,
                            $[a + 2] -= Ss
                }
            Ls = [Zs, Ys, Ss]
        }
        var p = y ? (t = os - V,
        M = As - E,
        qs - B) : (t = 2 * Vs(Rs(V), Rs(os)),
        M = 2 * Vs(Rs(E), Rs(As)),
        2 * Vs(Rs(B), Rs(qs)))
          , t = (y = Ps.rawS3 = ps.constrainModelScaleRatio(t, M, p))[0]
          , M = y[1];
        for (r in p = y[2],
        R) {
            if (j = R[r].vs,
            $ = R[r].lvs,
            !Os && ds) {
                for (i = j.length,
                a = 0; a < i; a += 3)
                    t && (j[a + 0] /= t),
                    M && (j[a + 1] /= M),
                    p && (j[a + 2] /= p);
                if ($)
                    for (i = $.length,
                    a = 0; a < i; a += 3)
                        t && ($[a + 0] /= t),
                        M && ($[a + 1] /= M),
                        p && ($[a + 2] /= p);
                var v = R[r].ns;
                if (v)
                    for (var i = v.length, zs = new js.Math.Vector3, a = 0; a < i; a += 3)
                        zs.set(v[a + 0] * t, v[a + 1] * M, v[a + 2] * p).normalize(),
                        v[a + 0] = zs.x,
                        v[a + 1] = zs.y,
                        v[a + 2] = zs.z
            }
            R[r].rawS3 = Ps.rawS3,
            Ls && (R[r].center = Ls)
        }
        if (A)
            (Y = as(Y, d)).externalAssetURIs = h;
        else
            for (var Qs in Y)
                Y[Qs].externalAssetURIs = h;
        y = d.shape3d;
        return y && (A ? Bs.setShape3dModel(y, Y) : Bs.setShape3dModel(y, ps.completeObjModelMapToShape3d(Y))),
        Y
    }
    ), as = function(y, C) {
        var g, F = [], H = {}, s = {
            model3d: !0,
            comps: F,
            matDef: H
        }, u = new js.Math.Box3, L = new js.Math.Box3, O = new js.Math.Vector3, d = new js.Math.Vector3, P = new js.Math.Vector3, o = {};
        for (g in y) {
            var A, q = y[g], Z = q.rawS3, Y = q.center, Z = ((Z || Y) && (O.copy(Z || [1, 1, 1]).multiplyScalar(.5),
            d.copy(Y || [0, 0, 0]),
            L.set(P.copy(d).sub(O), d.add(O)),
            u.expandByBox(L)),
            q.mtlName || g), Y = (H[Z] = S(B3.assign(Bs.objDefaultMaterial, {
                map: q.image,
                diffuse: q.image ? Is : q.color,
                transparent: !!q.transparent || Is,
                opacity: q.transparent ? q.opacity : Is,
                uvOffset: q.uvOffset,
                uvScale: q.uvScale
            })),
            q.compName || g), q = {
                mesh: S({
                    vs: q.vs,
                    uv: q.uv,
                    ns: q.ns,
                    lvs: q.lvs
                }),
                name: Y,
                mat: Z
            }, Z = o[Y];
            Z != Is ? (delete q.name,
            (A = F[Z]).comps ? A.comps.push(q) : (delete A.name,
            F[Z] = {
                name: Y,
                comps: [A, q]
            })) : (o[Y] = F.length,
            F.push(q))
        }
        return C.batchByMaterial && ps.batchModel3dByMaterial(s, C),
        ps.completeCubeCenterOfModel3d(s, {
            box3: u,
            preferBox3: C.box3,
            cube: C.cube,
            center: C.center,
            resetBounding: C.resetBounding,
            rotationMode: C.rotationMode,
            t3: C.t3,
            r3: C.r3,
            s3: C.s3
        }),
        C.matDef && B3.assign(s.matDef, C.matDef),
        s
    }, Xs = function(y) {
        var C = {};
        if (y)
            for (var g, F, H, s, u = new is(y), L = /\s+/; null != (H = u.stepNext()); )
                0 !== (H = H.trim()).length && "#" !== H.charAt(0) && (F = ((s = H.indexOf(" ")) ? H.substring(0, s) : H).toLowerCase(),
                H = (s ? H.substring(s + 1) : "").trim(),
                "newmtl" === F ? C[H] = g = {
                    name: H
                } : g && ("ka" === F || "kd" === F || "ks" === F ? (s = H.split(L, 3),
                g[F] = [parseFloat(s[0]), parseFloat(s[1]), parseFloat(s[2]), 1]) : g[F] = "ns" === F || "d" === F ? parseFloat(H) : H));
        return C
    };
    function S(y) {
        var C, g = {};
        for (C in y)
            y[C] != Is && (g[C] = y[C]);
        return g
    }
    function Ds(y, C, g, F, H) {
        y.lvs && (F = L(C, F),
        C = L(C, H),
        H = g.matrix,
        g = y.lvs,
        H ? (P(g, O(u(F), H)),
        P(g, O(u(C), H))) : (P(g, F),
        P(g, C)))
    }
    function ts(y, C, g, F, H, s) {
        y.vs && (F = L(C, F),
        H = L(C, H),
        C = L(C, s),
        s = g.matrix,
        y = y.vs,
        g.flipFace && (g = H,
        H = C,
        C = g),
        s ? (P(y, O(u(F), s)),
        P(y, O(u(H), s)),
        P(y, O(u(C), s))) : (P(y, F),
        P(y, H),
        P(y, C)))
    }
    function Ms(y, C, g, F, H, s) {
        var u;
        y.vs && (u = g.flipY,
        F = F === Is ? d : L(C, F),
        H = H === Is ? d : L(C, H),
        C = s === Is ? d : L(C, s),
        g.flipFace && (s = H,
        H = C,
        C = s),
        y.uv.push(F[0], u ? 1 - F[1] : F[1], H[0], u ? 1 - H[1] : H[1], C[0], u ? 1 - C[1] : C[1]))
    }
    function vs(y, C, g, F, H, s) {
        y.vs && (F = L(C, F),
        H = L(C, H),
        C = L(C, s),
        s = g.normalMatrix,
        y = y.ns,
        g.flipFace && (g = H,
        H = C,
        C = g),
        s ? (P(y, O(u(F), s)),
        P(y, O(u(H), s)),
        P(y, O(u(C), s))) : (P(y, F),
        P(y, H),
        P(y, C)))
    }
    var is = function(y) {
        var F, H, s, C, g, u;
        y instanceof ArrayBuffer ? (this.isBuffer = !0,
        F = 0,
        H = new Uint8Array(y),
        s = H.length,
        u = H.length,
        this.stepNext = function() {
            for (var y, C, g = F; F < s; )
                if (12 == (C = (y = H[F]) >> 4) || 13 == C)
                    F += 2;
                else if (14 == C)
                    F += 3;
                else if (F++,
                10 === y)
                    return String.fromCharCode.apply(null, H.subarray(g, F));
            return g < F ? String.fromCharCode.apply(null, H.subarray(g, F)) : null
        }
        ) : (this.isBuffer = !1,
        C = y.split("\n"),
        g = 0,
        u = C.length,
        this.stepNext = function() {
            return g < u ? C[g++] : null
        }
        )
    }
      , A = (is.prototype = {},
    is.prototype.constructor = is,
    ps.addMethod(Bs, {
        objDefaultMaterial: {
            type: "litePhong"
        },
        objUseTextOnly: !1,
        loadObj: function(y, C, H) {
            H = H || {};
            function g(y) {
                var C, g = H.finishFunc, F = H.shape3d;
                (y = y ? o(y[0], y[1], H) : null) ? (F = (y.model3d ? y : C = F ? Bs.getShape3dModel(F) : ps.completeObjModelMapToShape3d(y)).rawS3,
                g && g(y, C, F)) : g && g(null)
            }
            var F, s = !1;
            !Bs.objUseTextOnly && R.navigator && /(MSIE |Trident\/|Edge\/)/.test(R.navigator.userAgent) && (s = !0);
            s ? (H.responseType = "arraybuffer",
            F = function(C) {
                Bs.xhrLoad(y, function(y) {
                    g([y, C])
                }, H)
            }
            ,
            C ? Bs.xhrLoad(C, function(y) {
                F(y)
            }, H) : F()) : Bs.xhrLoad(C ? [y, C] : [y], g, H)
        },
        parseObj: function(y, C, g) {
            return o(y, C, g)
        }
    }, !0),
    js.ByteBuffer = function(y, C, g) {
        if (void 0 === y && (y = A.DEFAULT_CAPACITY),
        void 0 === C && (C = A.DEFAULT_ENDIAN),
        !(g = void 0 === g ? A.DEFAULT_NOASSERT : g)) {
            if ((y |= 0) < 0)
                throw RangeError("Illegal capacity");
            C = !!C,
            g = !!g
        }
        this.buffer = 0 === y ? H : new ArrayBuffer(y),
        this.view = 0 === y ? null : new Uint8Array(this.buffer),
        this.offset = 0,
        this.markedOffset = -1,
        this.limit = y,
        this.littleEndian = C,
        this.noAssert = g,
        this.bufferId = 0
    }
    )
      , H = new ArrayBuffer(0);
    function n() {
        var y = []
          , C = [];
        return function() {
            if (0 === arguments.length)
                return C.join("") + g.apply(String, y);
            1024 < y.length + arguments.length && (C.push(g.apply(String, y)),
            y.length = 0),
            Array.prototype.push.apply(y, arguments)
        }
    }
    B3.defineProperties(A.prototype, {
        offset: {
            get: function() {
                return this._offset
            },
            set: function(y) {
                (this._offset = y) && y >= this.limit && this.trySwitchNextBuffer()
            }
        }
    }),
    A.LITTLE_ENDIAN = !0,
    A.BIG_ENDIAN = !1,
    A.DEFAULT_CAPACITY = 16,
    A.DEFAULT_ENDIAN = A.BIG_ENDIAN,
    A.DEFAULT_NOASSERT = !1,
    A.METRICS_BYTES = "b";
    var g = String.fromCharCode
      , y = A.prototype;
    y.trySwitchNextBuffer = function() {
        var y = this.buffers[++this.bufferId];
        y && (this.buffer = y,
        this.limit = y.byteLength,
        this.offset = 0,
        this.view = 0 < y.byteLength ? new Uint8Array(y) : null)
    }
    ,
    y.readUint8 = function(y) {
        var C = void 0 === y;
        if (C && (y = this.offset),
        !this.noAssert) {
            if ("number" != typeof y || y % 1 != 0)
                throw TypeError("Illegal offset: " + y + " (not an integer)");
            if ((y >>>= 0) < 0 || y + 1 > this.buffer.byteLength)
                throw RangeError("Illegal offset: 0 <= " + y + " (+1) <= " + this.buffer.byteLength)
        }
        y = this.view[y];
        return C && (this.offset += 1),
        y
    }
    ,
    y.readUint16 = function(y) {
        var C = void 0 === y;
        if (C && (y = this.offset),
        !this.noAssert) {
            if ("number" != typeof y || y % 1 != 0)
                throw TypeError("Illegal offset: " + y + " (not an integer)");
            if ((y >>>= 0) < 0 || y + 2 > this.buffer.byteLength)
                throw RangeError("Illegal offset: 0 <= " + y + " (+2) <= " + this.buffer.byteLength)
        }
        var g = 0;
        return this.littleEndian ? (g = this.view[y],
        g |= this.view[y + 1] << 8) : (g = this.view[y] << 8,
        g |= this.view[y + 1]),
        C && (this.offset += 2),
        g
    }
    ,
    y.readUint24 = function(y) {
        var C = void 0 === y;
        if (C && (y = this.offset),
        !this.noAssert) {
            if ("number" != typeof y || y % 1 != 0)
                throw TypeError("Illegal offset: " + y + " (not an integer)");
            if ((y >>>= 0) < 0 || y + 3 > this.buffer.byteLength)
                throw RangeError("Illegal offset: 0 <= " + y + " (+4) <= " + this.buffer.byteLength)
        }
        var g = 0
          , g = this.littleEndian ? (g = this.view[y + 2] << 16,
        (g |= this.view[y + 1] << 8) | this.view[y]) : (g = this.view[y + 1] << 8,
        (g |= this.view[y + 2]) + (this.view[y] << 16 >>> 0));
        return g |= 0,
        C && (this.offset += 3),
        g
    }
    ,
    y.readUint32 = function(y) {
        var C = void 0 === y;
        if (C && (y = this.offset),
        !this.noAssert) {
            if ("number" != typeof y || y % 1 != 0)
                throw TypeError("Illegal offset: " + y + " (not an integer)");
            if ((y >>>= 0) < 0 || y + 4 > this.buffer.byteLength)
                throw RangeError("Illegal offset: 0 <= " + y + " (+4) <= " + this.buffer.byteLength)
        }
        var g = 0
          , g = this.littleEndian ? (g = this.view[y + 2] << 16,
        (g = (g |= this.view[y + 1] << 8) | this.view[y]) + (this.view[y + 3] << 24 >>> 0)) : (g = this.view[y + 1] << 16,
        (g = (g |= this.view[y + 2] << 8) | this.view[y + 3]) + (this.view[y] << 24 >>> 0));
        return C && (this.offset += 4),
        g
    }
    ,
    y.readArrayInBits = function(y, C, g, F) {
        for (var H, s = void 0 === F, u = (s && (F = this.offset),
        Math.ceil(y * C / 8)), L = (g = g || new Array(y),
        0), O = 0, d = this.view, F = this.offset, P = 0, o = 0; o < y; o++) {
            for (O = L = 0; O < C; )
                L = L << (H = Math.min(C - O, 8 - P)) | d[F] >> 8 - P - H & (1 << H) - 1,
                O += H,
                0 === (P = (P + H) % 8) && F++;
            g[o] = L
        }
        return s && (this.offset += u),
        L
    }
    ,
    y.readFloat32 = function(y) {
        var C = void 0 === y;
        if (C && (y = this.offset),
        !this.noAssert) {
            if ("number" != typeof y || y % 1 != 0)
                throw TypeError("Illegal offset: " + y + " (not an integer)");
            if ((y >>>= 0) < 0 || y + 4 > this.buffer.byteLength)
                throw RangeError("Illegal offset: 0 <= " + y + " (+4) <= " + this.buffer.byteLength)
        }
        y = function(y, C, g, F, H) {
            var s, u, L = 8 * H - F - 1, O = (1 << L) - 1, d = O >> 1, P = -7, o = g ? H - 1 : 0, A = g ? -1 : 1, H = y[C + o];
            for (o += A,
            s = H & (1 << -P) - 1,
            H >>= -P,
            P += L; 0 < P; s = 256 * s + y[C + o],
            o += A,
            P -= 8)
                ;
            for (u = s & (1 << -P) - 1,
            s >>= -P,
            P += F; 0 < P; u = 256 * u + y[C + o],
            o += A,
            P -= 8)
                ;
            if (0 === s)
                s = 1 - d;
            else {
                if (s === O)
                    return u ? NaN : 1 / 0 * (H ? -1 : 1);
                u += Math.pow(2, F),
                s -= d
            }
            return (H ? -1 : 1) * u * Math.pow(2, s - F)
        }(this.view, y, this.littleEndian, 23, 4);
        return C && (this.offset += 4),
        y
    }
    ,
    y.batchReadToFixedArray = function(y, C, g) {
        var F = this.view
          , H = void 0 === g;
        H && (g = this.offset),
        new Uint8Array(y.buffer).set(F.subarray(g, g + C)),
        H && (this.offset += C)
    }
    ,
    y.batchReadUint8 = function(y, C, g) {
        return this.batchReadToFixedArray(y, C, g)
    }
    ,
    y.batchReadUint16 = function(y, C, g) {
        return this.batchReadToFixedArray(y, 2 * C, g)
    }
    ,
    y.batchReadUint32 = function(y, C, g) {
        return this.batchReadToFixedArray(y, 4 * C, g)
    }
    ,
    y.batchReadFloat32 = function(y, C, g) {
        return this.batchReadToFixedArray(y, 4 * C, g)
    }
    ;
    function q(y, C, g) {
        if (y.length) {
            for (var F = 0; F < y.length; F++)
                if (!y[F])
                    return void (C && C(null));
            var H = y[0]
              , s = 12 < H.byteLength && 0 < (1 & new Uint8Array(H)[12])
              , u = new A(0,s);
            if ($(u, H),
            u.buffers = y,
            u.readUint8(4) === _)
                return X(y, u, C);
            var L = u.readUint8(11);
            if (v(L)) {
                H = u.view.slice(V);
                if (!g && !1 !== Bs.useNativeDecompression && r)
                    return void j(H, function(y) {
                        return i(u, y),
                        a(u, L, s, C)
                    });
                i(u, J.inflate(H))
            }
            return a(u, L, s, C)
        }
        C && C(null)
    }
    function Z(y, C, g, F, H) {
        var s, u, L, O, d, P = C.readUint32(), o = (C.readUint8(),
        C.readUint32()), A = C.readUint32(), q = [];
        if ("uv" === F)
            for (Z = 0; Z < P; Z++)
                s = T(C),
                u = T(C),
                q.push([s, u]);
        else if ("ns" === F)
            for (Z = 0; Z < P; Z++)
                q.push(U(C));
        else
            for (var Z = 0; Z < P; Z++)
                q.push(z(C));
        if (L = P < 256 ? "readUint8" : P < 65536 ? "readUint16" : P < 16777216 ? "readUint24" : "readUint32",
        o)
            for (O = y[F] = [],
            Z = 0; Z < o; Z++)
                d = q[C[L]()],
                "uv" === F ? O.push(d[0], d[1]) : O.push(d[0], d[1], d[2]);
        if (A)
            for (O = y[H] = [],
            Z = 0; Z < A; Z++)
                d = q[C[L]()],
                O.push(d[0], d[1], d[2])
    }
    var F, s, Y = F = {
        MAX_CODEPOINT: 1114111,
        decodeUTF8: function(y, C) {
            for (var g, F, H, s, u = function(y) {
                y = y.slice(0, y.indexOf(null));
                var C = Error(y.toString());
                throw C.name = "TruncatedError",
                C.bytes = y,
                C
            }; null !== (g = y()); )
                if (0 == (128 & g))
                    C(g);
                else if (192 == (224 & g))
                    null === (F = y()) && u([g, F]),
                    C((31 & g) << 6 | 63 & F);
                else if (224 == (240 & g))
                    null !== (F = y()) && null !== (H = y()) || u([g, F, H]),
                    C((15 & g) << 12 | (63 & F) << 6 | 63 & H);
                else {
                    if (240 != (248 & g))
                        throw RangeError("Illegal starting byte: " + g);
                    null !== (F = y()) && null !== (H = y()) && null !== (s = y()) || u([g, F, H, s]),
                    C((7 & g) << 18 | (63 & F) << 12 | (63 & H) << 6 | 63 & s)
                }
        },
        UTF16toUTF8: function(y, C) {
            for (var g, F = null; null !== (g = null !== F ? F : y()); )
                55296 <= g && g <= 57343 && null !== (F = y()) && 56320 <= F && F <= 57343 ? (C(1024 * (g - 55296) + F - 56320 + 65536),
                F = null) : C(g);
            null !== F && C(F)
        },
        UTF8toUTF16: function(y, C) {
            var g = null;
            for ("number" == typeof y && (g = y,
            y = function() {
                return null
            }
            ); null !== g || null !== (g = y()); )
                g <= 65535 ? C(g) : (C(55296 + ((g -= 65536) >> 10)),
                C(g % 1024 + 56320)),
                g = null
        },
        decodeUTF8toUTF16: function(y, C) {
            F.decodeUTF8(y, function(y) {
                F.UTF8toUTF16(y, C)
            })
        },
        calculateCodePoint: function(y) {
            return y < 128 ? 1 : y < 2048 ? 2 : y < 65536 ? 3 : 4
        },
        calculateUTF8: function(y) {
            for (var C, g = 0; null !== (C = y()); )
                g += C < 128 ? 1 : C < 2048 ? 2 : C < 65536 ? 3 : 4;
            return g
        },
        calculateUTF16asUTF8: function(y) {
            var C = 0
              , g = 0;
            return F.UTF16toUTF8(y, function(y) {
                ++C,
                g += y < 128 ? 1 : y < 2048 ? 2 : y < 65536 ? 3 : 4
            }),
            [C, g]
        }
    }, r = (y.readString = function(y, C, g) {
        "number" == typeof C && (g = C,
        C = Is);
        var F = void 0 === g;
        if (F && (g = this.offset),
        void 0 === C && (C = A.METRICS_CHARS),
        !this.noAssert) {
            if ("number" != typeof y || y % 1 != 0)
                throw TypeError("Illegal length: " + y + " (not an integer)");
            if (y |= 0,
            "number" != typeof g || g % 1 != 0)
                throw TypeError("Illegal offset: " + g + " (not an integer)");
            if ((g >>>= 0) < 0 || g + 0 > this.buffer.byteLength)
                throw RangeError("Illegal offset: 0 <= " + g + " (+0) <= " + this.buffer.byteLength)
        }
        var H, s = 0, u = g;
        if (C === A.METRICS_CHARS) {
            if (H = n(),
            Y.decodeUTF8(function() {
                return s < y && g < this.limit ? this.view[g++] : null
            }
            .bind(this), function(y) {
                ++s,
                Y.UTF8toUTF16(y, H)
            }),
            s !== y)
                throw RangeError("Illegal range: Truncated data, " + s + " == " + y);
            return F ? (this.offset = g,
            H()) : {
                string: H(),
                length: g - u
            }
        }
        if (C !== A.METRICS_BYTES)
            throw TypeError("Unsupported metrics: " + C);
        if (!this.noAssert) {
            if ("number" != typeof g || g % 1 != 0)
                throw TypeError("Illegal offset: " + g + " (not an integer)");
            if ((g >>>= 0) < 0 || g + y > this.buffer.byteLength)
                throw RangeError("Illegal offset: 0 <= " + g + " (+" + y + ") <= " + this.buffer.byteLength)
        }
        var L = g + y;
        if (Y.decodeUTF8toUTF16(function() {
            return g < L ? this.view[g++] : null
        }
        .bind(this), H = n(), this.noAssert),
        g !== L)
            throw RangeError("Illegal range: Truncated data, " + g + " == " + L);
        return F ? (this.offset = g,
        H()) : {
            string: H(),
            length: g - u
        }
    }
    ,
    "undefined" != typeof DecompressionStream), j = function(y, C) {
        var g = new DecompressionStream("deflate")
          , y = new Blob([y]).stream().pipeThrough(g);
        new Response(y).arrayBuffer().then(function(y) {
            C(new Uint8Array(y))
        })
    }, $ = function(y, C) {
        y.buffer = C,
        y.limit = C.byteLength,
        y.view = 0 < C.byteLength ? new Uint8Array(C) : null
    }, v = function(y) {
        return 2 === y || 3 === y
    }, i = function(y, C) {
        var g = V
          , F = new Uint8Array(g + C.byteLength);
        F.set(y.view.slice(0, g), 0),
        F.set(C, g),
        $(y, F)
    }, a = function(y, C, g, F) {
        if (0 !== (C = C) && 3 !== C)
            H = function(y, C) {
                y.offset += V;
                for (var g = E(y), F = Bs.parse(g), H = y.readUint8(), s = y.readUint16(), u = (y.offset += H - 2,
                {}), L = (u.uvBits = (s & 31744) >> 10 || p,
                u.normalBits = (s & 992) >> 5 || t,
                u.positionBits = s & 31 || M,
                y.readUint16()), O = [], d = false, P = 0, o, A, q, Z; P < L; P++) {
                    var Y = y.readUint16();
                    switch (Y) {
                    case B:
                        A = y.readUint32();
                        Z = new Uint8Array(A);
                        if (A)
                            y.batchReadUint8(Z, A);
                        O.push(Z);
                        d = true;
                        continue;
                    case 0:
                        o = "readUint8";
                        A = y.readUint32();
                        Z = new Uint8Array(A);
                        if (C)
                            q = "batchReadUint8";
                        break;
                    case 1:
                        o = "readUint16";
                        A = y.readUint32() / 2;
                        Z = new Uint16Array(A);
                        if (C)
                            q = "batchReadUint16";
                        break;
                    case 2:
                        o = "readUint32";
                        A = y.readUint32() / 4;
                        Z = new Uint32Array(A);
                        if (C)
                            q = "batchReadUint32";
                        break;
                    case 3:
                        o = "readFloat32";
                        A = y.readUint32() / 4;
                        Z = new Float32Array(A);
                        if (C)
                            q = "batchReadFloat32";
                        break;
                    default:
                        o = null;
                        break
                    }
                    if (o) {
                        if (q)
                            y[q](Z, A);
                        else
                            for (var S = 0; S < A; S++)
                                Z[S] = y[o]();
                        O.push(Z)
                    } else
                        O.push(w.dequantize(y, Y, u))
                }
                var z = function(y, C) {
                    var g = y[C];
                    if (typeof g !== "number" || g < 0 || g >= L)
                        return;
                    y[C] = O[g]
                }
                  , Q = function(y, C) {
                    C = C || "image/png";
                    var g = typeof URL !== "undefined" ? URL : typeof R !== "undefined" ? R.URL || R.webkitURL : null;
                    if (typeof Blob !== "undefined" && g && g.createObjectURL)
                        return g.createObjectURL(new Blob([y],{
                            type: C
                        }));
                    var F = "";
                    for (var H = 0, s = y.length; H < s; H++)
                        F += String.fromCharCode(y[H]);
                    var u;
                    if (typeof btoa === "function")
                        u = btoa(F);
                    else if (typeof Buffer !== "undefined")
                        u = Buffer.from(F, "binary").toString("base64");
                    else
                        return null;
                    return "data:" + C + ";base64," + u
                }
                  , I = function(y) {
                    if (!y || !y.__htPackedImage)
                        return y;
                    var C = O[y.buffer];
                    if (!C)
                        return y.src;
                    var g = y.src;
                    var F = Q(C, y.mimeType);
                    if (!F)
                        return g;
                    if (typeof g === "string" && g.indexOf("internalAssets#") === 0) {
                        Bs.setImage(g, F);
                        return g
                    }
                    return F
                }
                  , _ = function(y) {
                    if (!y || typeof y !== "object")
                        return y;
                    var F = function(y, C) {
                        if (!C || typeof C !== "object")
                            return false;
                        if (y === "comps")
                            return true;
                        if (Array.isArray(C))
                            return false;
                        if (ArrayBuffer.isView && ArrayBuffer.isView(C))
                            return false;
                        return true
                    };
                    var H = [];
                    var s = function(y) {
                        if (!y || typeof y !== "object")
                            return;
                        if (H.indexOf(y) >= 0)
                            return;
                        H.push(y);
                        for (var C in y) {
                            var g = y[C];
                            if (g && g.__htPackedImage)
                                y[C] = I(g);
                            else if (F(C, g))
                                s(g)
                        }
                    };
                    s(y);
                    return y
                }
                  , J = function(y) {
                    Bs.traverse(y, function(y) {
                        if (!y)
                            return;
                        var C = y.animations;
                        var g = y.mesh;
                        var F = y.instances;
                        var H = y.skeleton;
                        if (!C && !g && !H && !F)
                            return y;
                        if (C)
                            for (var s = 0, u = C.length; s < u; s++) {
                                var L = C[s];
                                var O = L.tracks;
                                delete L._typeProcessed;
                                for (var d = 0, P = O.length; d < P; d++) {
                                    var o = O[d];
                                    z(o, "times");
                                    z(o, "values")
                                }
                            }
                        if (g) {
                            z(g, "vs");
                            z(g, "is");
                            z(g, "uv");
                            z(g, "uv2");
                            z(g, "ns");
                            z(g, "skinIndex");
                            z(g, "skinWeight");
                            z(g, "color");
                            z(g, "tangent")
                        }
                        if (H)
                            z(H, "boneMatrixInverses");
                        if (F)
                            z(F, "aMatrixInstanced")
                    }, null, "comps")
                };
                if (F.lod) {
                    var n = F.lod.group;
                    for (var r = 0, j = n.length; r < j; r++) {
                        var $ = n[r];
                        if (typeof $ === "string")
                            continue;
                        J($)
                    }
                } else
                    J(F);
                if (d)
                    _(F);
                return F
            }(y, g);
        else {
            var H = []
              , C = y.readUint8(10)
              , g = (y.offset += V,
            H)
              , s = y
              , u = s.readUint8();
            if (u & 1)
                g.center = z(s);
            if (u & 2)
                g.rawS3 = z(s);
            for (var L = H, O = y, d = ((C || 0) << 8) + O.readUint8(), P = 0; P < d; P++)
                L.push(D(O))
        }
        u = {
            shapeModel: H,
            byteBuffer: y
        };
        return F && F(u),
        u
    }, X = function(y, C, g) {
        var F, H = C.readUint16(V), s = [];
        for (C.offset = V + 2,
        F = 0; F < H; F++)
            L = E(C),
            O = C.readUint32(),
            s.push({
                url: L,
                length: O
            });
        var u = C.offset;
        for (y = y.slice(C.bufferId),
        F = 0; F < H; F++) {
            var L = s[F].url
              , O = s[F].length
              , d = y[0]
              , P = (y[0] = d.slice(u, u + O),
            q(y, g))
              , o = P.shapeModel
              , C = P.byteBuffer;
            u + O === d.byteLength ? y = y.slice(1) : y[0] = d.slice(u + O),
            u = 0,
            s[F].shapeModel = o,
            js.Default.setShape3dModel(L, o)
        }
        return s
    }, z = function(y) {
        return [y.readFloat32(), y.readFloat32(), y.readFloat32()]
    }, E = function(y) {
        var C = y.readUint32();
        return y.readString(C, A.METRICS_BYTES)
    }, D = function(y) {
        var C = {}
          , g = y.readUint32()
          , F = 0
          , H = g & 1 << F++
          , s = g & 1 << F++
          , u = g & 1 << F++
          , L = g & 1 << F++
          , O = g & 1 << F++
          , d = g & 1 << F++
          , P = g & 1 << F++
          , o = g & 1 << F++
          , A = g & 1 << F++
          , q = g & 1 << F++
          , F = g & 1 << +F
          , g = 2048 & g;
        return (H || s) && Z(C, y, 0, "vs", "lvs"),
        u && Z(C, y, 0, "uv"),
        L && Z(C, y, 0, "ns"),
        O && (C.name = E(y)),
        d && (C.color = z(y)),
        P && (C.transparent = !!y.readUint8()),
        o && (C.opacity = y.readFloat32()),
        A && (C.uvOffset = [(H = y).readFloat32(), H.readFloat32()]),
        q && (C.uvScale = z(y)),
        F && (C.image = E(y)),
        g && (C.reverseFlip = !!y.readUint8()),
        C
    }, T = function(y) {
        var C = y.readUint16()
          , g = (16383 & C) / 16383
          , F = 0;
        return (16384 & C ? 1 : -1) * ((F = 32768 & C ? y.readUint16() : F) + g)
    }, U = function(y) {
        var y = y.readUint32()
          , C = y & 1 << 28
          , g = (y >> 14 & 16383) / 16383
          , F = (16383 & y) / 16383;
        return [g * (y & 1 << 30 ? 1 : -1), F * (y & 1 << 29 ? 1 : -1), (Math.sqrt(1 - g * g - F * F) || 0) * (C ? 1 : -1)]
    }, w = (Bs.getInternal().addMethod(Bs, {
        loadBin: function(s, u) {
            function L(y) {
                var F, H = u.finishFunc, s = u.shape3d;
                q(y, function(y) {
                    var C = y ? y.shapeModel : null;
                    if (C) {
                        if (s)
                            F = Bs.getShape3dModel(s);
                        else {
                            for (var g in F = [],
                            C) {
                                g = C[g];
                                g && g.rawS3 && (F.rawS3 = g.rawS3),
                                F.push(g)
                            }
                            C.rawS3 && (F.rawS3 = C.rawS3)
                        }
                        H && H(C, F, F.rawS3)
                    } else
                        H && H(null)
                })
            }
            function F(y, C) {
                for (var g = [], F = (C || g.push(s),
                s.substr(0, s.length - 4)), H = 1; H < y; H++)
                    g.push(F + H + ".bin");
                Bs.xhrLoad(g, function(y) {
                    C && y.splice(0, 0, C),
                    L(y)
                }, u)
            }
            (u = u || {}).responseType = "arraybuffer",
            u.packageNum ? F(u.packageNum) : Bs.xhrLoad(s, function(y) {
                var C, g;
                y = y,
                g = u.finishFunc,
                y ? 1 < (C = new Uint8Array(y)[9]) ? F(C, y) : L([y]) : g && g(null)
            }, u)
        },
        parseBin: function(y) {
            y = [y];
            if (y = q(y, Is, !0))
                return y.shapeModel
        }
    }),
    s = {
        4: function(y) {
            y = h(y),
            y = G(W(y));
            return N(y)
        },
        5: function(y) {
            for (var y = h(y), y = G(W(y)), C = N(y), g = 0, F = C.length; g < F; g++)
                C[g] = Q(C[g], 8);
            return C
        },
        6: function(y) {
            for (var C = y.readUint32() / 12 * 16, g = new Array(C), F = 0; F < C; F += 16)
                g[F] = y.readFloat32(),
                g[F + 1] = y.readFloat32(),
                g[F + 2] = y.readFloat32(),
                g[F + 3] = 0,
                g[F + 4] = y.readFloat32(),
                g[F + 5] = y.readFloat32(),
                g[F + 6] = y.readFloat32(),
                g[F + 7] = 0,
                g[F + 8] = y.readFloat32(),
                g[F + 9] = y.readFloat32(),
                g[F + 10] = y.readFloat32(),
                g[F + 11] = 0,
                g[F + 12] = y.readFloat32(),
                g[F + 13] = y.readFloat32(),
                g[F + 14] = y.readFloat32(),
                g[F + 15] = 1;
            return g
        },
        7: function(y, C) {
            var g = y.readFloat32()
              , F = y.readFloat32()
              , H = y.readFloat32()
              , s = y.readFloat32()
              , u = y.readUint32()
              , L = H === g ? 0 : H - g
              , O = s === F ? 0 : s - F
              , d = C.uvBits
              , P = new Float32Array(u);
            y.readArrayInBits(u, d, P);
            for (var o = 0; o < u; o += 2)
                P[o] = Q(P[o], d) * L + g,
                P[o + 1] = Q(P[o + 1], d) * O + F;
            return P
        },
        8: function(y, C) {
            var g = y.readUint32()
              , F = new Float32Array(g)
              , H = C.normalBits;
            y.readArrayInBits(g, H, F);
            for (var s = 0; s < g; s += 3)
                F[s] = I(F[s], H),
                F[s + 1] = I(F[s + 1], H),
                F[s + 2] = I(F[s + 2], H);
            return F
        },
        9: function(y, C) {
            var g = y.readFloat32()
              , F = y.readFloat32()
              , H = y.readFloat32()
              , s = y.readFloat32()
              , u = y.readUint32()
              , L = new Float32Array(u)
              , O = C.positionBits;
            y.readArrayInBits(u, O, L);
            for (var d = 0; d < u; d += 3)
                L[d] = Q(L[d], O) * s + g,
                L[d + 1] = Q(L[d + 1], O) * s + F,
                L[d + 2] = Q(L[d + 2], O) * s + H;
            return L
        }
    },
    {
        dequantize: function(y, C, g) {
            C = s[C];
            if (C)
                return C(y, g)
        }
    });
    function G(y) {
        for (var C = [], g = 0; g < y.length; g += 2)
            for (var F = y[g], H = y[g + 1], s = 0; s < F; s++)
                C.push(H);
        return C
    }
    function W(y) {
        for (var C, g = [], F = 0, H = 0, s = 0, u = y.length; s < u; s++)
            F |= (127 & (C = y[s])) << H,
            0 == (128 & C) ? (g.push(F),
            H = F = 0) : H += 7;
        return g
    }
    function N(y) {
        for (var C = y.length, g = C / 4, F = 2 * g, H = 3 * g, s = new Array(C), u = 0; u < g; u++)
            s[4 * u] = y[u],
            s[4 * u + 1] = y[u + g],
            s[4 * u + 2] = y[u + F],
            s[4 * u + 3] = y[u + H];
        return s
    }
    function h(y) {
        for (var C = y.readUint32(), g = new Uint8Array(C), F = 0; F < C; F++)
            g[F] = y.readUint8();
        return g
    }
    function Q(y, C) {
        return y / ((1 << C) - 1)
    }
    function I(y, C) {
        return (y = (C = (1 << C - 1) - 1) < y ? -(y - C - 1) / C : y / C) < -1 ? -1 : 1 < y ? 1 : y
    }
}("undefined" != typeof global ? global : "undefined" != typeof self ? self : "undefined" != typeof window ? window : (0,
eval)("this"), Object);
