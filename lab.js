var BUILDNO = 37 ;
// rev 482
/********************************************************************************
 *                                                                              *
 * Author    :  Angus Johnson                                                   *
 * Version   :  6.2.1                                                          *
 * Date      :  31 October 2014                                                 *
 * Website   :  http://www.angusj.com                                           *
 * Copyright :  Angus Johnson 2010-2014                                         *
 *                                                                              *
 * License:                                                                     *
 * Use, modification & distribution is subject to Boost Software License Ver 1. *
 * http://www.boost.org/LICENSE_1_0.txt                                         *
 *                                                                              *
 * Attributions:                                                                *
 * The code in this library is an extension of Bala Vatti's clipping algorithm: *
 * "A generic solution to polygon clipping"                                     *
 * Communications of the ACM, Vol 35, Issue 7 (July 1992) pp 56-63.             *
 * http://portal.acm.org/citation.cfm?id=129906                                 *
 *                                                                              *
 * Computer graphics and geometric modeling: implementation and algorithms      *
 * By Max K. Agoston                                                            *
 * Springer; 1 edition (January 4, 2005)                                        *
 * http://books.google.com/books?q=vatti+clipping+agoston                       *
 *                                                                              *
 * See also:                                                                    *
 * "Polygon Offsetting by Computing Winding Numbers"                            *
 * Paper no. DETC2005-85513 pp. 565-575                                         *
 * ASME 2005 International Design Engineering Technical Conferences             *
 * and Computers and Information in Engineering Conference (IDETC/CIE2005)      *
 * September 24-28, 2005 , Long Beach, California, USA                          *
 * http://www.me.berkeley.edu/~mcmains/pubs/DAC05OffsetPolygon.pdf              *
 *                                                                              *
 *******************************************************************************/
/*******************************************************************************
 *                                                                              *
 * Author    :  Timo                                                            *
 * Version   :  6.2.1.0                                                         *
 * Date      :  17 June 2016                                                 *
 *                                                                              *
 * This is a translation of the C# Clipper library to Javascript.               *
 * Int128 struct of C# is implemented using JSBN of Tom Wu.                     *
 * Because Javascript lacks support for 64-bit integers, the space              *
 * is a little more restricted than in C# version.                              *
 *                                                                              *
 * C# version has support for coordinate space:                                 *
 * +-4611686018427387903 ( sqrt(2^127 -1)/2 )                                   *
 * while Javascript version has support for space:                              *
 * +-4503599627370495 ( sqrt(2^106 -1)/2 )                                      *
 *                                                                              *
 * Tom Wu's JSBN proved to be the fastest big integer library:                  *
 * http://jsperf.com/big-integer-library-test                                   *
 *                                                                              *
 * This class can be made simpler when (if ever) 64-bit integer support comes.  *
 *                                                                              *
 *******************************************************************************/
/*******************************************************************************
 *                                                                              *
 * Basic JavaScript BN library - subset useful for RSA encryption.              *
 * http://www-cs-students.stanford.edu/~tjw/jsbn/                               *
 * Copyright (c) 2005  Tom Wu                                                   *
 * All Rights Reserved.                                                         *
 * See "LICENSE" for details:                                                   *
 * http://www-cs-students.stanford.edu/~tjw/jsbn/LICENSE                        *
 *                                                                              *
 *******************************************************************************/
(function(){function k(a,b,c){d.biginteger_used=1;null!=a&&("number"==typeof a&&"undefined"==typeof b?this.fromInt(a):"number"==typeof a?this.fromNumber(a,b,c):null==b&&"string"!=typeof a?this.fromString(a,256):this.fromString(a,b))}function m(){return new k(null,void 0,void 0)}function R(a,b,c,e,d,g){for(;0<=--g;){var h=b*this[a++]+c[e]+d;d=Math.floor(h/67108864);c[e++]=h&67108863}return d}function S(a,b,c,e,d,g){var h=b&32767;for(b>>=15;0<=--g;){var l=this[a]&32767,k=this[a++]>>15,n=b*l+k*h,l=h*
l+((n&32767)<<15)+c[e]+(d&1073741823);d=(l>>>30)+(n>>>15)+b*k+(d>>>30);c[e++]=l&1073741823}return d}function T(a,b,c,e,d,g){var h=b&16383;for(b>>=14;0<=--g;){var l=this[a]&16383,k=this[a++]>>14,n=b*l+k*h,l=h*l+((n&16383)<<14)+c[e]+d;d=(l>>28)+(n>>14)+b*k;c[e++]=l&268435455}return d}function M(a,b){var c=D[a.charCodeAt(b)];return null==c?-1:c}function x(a){var b=m();b.fromInt(a);return b}function E(a){var b=1,c;0!=(c=a>>>16)&&(a=c,b+=16);0!=(c=a>>8)&&(a=c,b+=8);0!=(c=a>>4)&&(a=c,b+=4);0!=(c=a>>2)&&
(a=c,b+=2);0!=a>>1&&(b+=1);return b}function A(a){this.m=a}function B(a){this.m=a;this.mp=a.invDigit();this.mpl=this.mp&32767;this.mph=this.mp>>15;this.um=(1<<a.DB-15)-1;this.mt2=2*a.t}function U(a,b){return a&b}function K(a,b){return a|b}function N(a,b){return a^b}function O(a,b){return a&~b}function C(){}function P(a){return a}function z(a){this.r2=m();this.q3=m();k.ONE.dlShiftTo(2*a.t,this.r2);this.mu=this.r2.divide(a);this.m=a}var d={},F=!1;"undefined"!==typeof module&&module.exports?(module.exports=
d,F=!0):"undefined"!==typeof document?window.ClipperLib=d:self.ClipperLib=d;var q;if(F)r="chrome",q="Netscape";else{var r=navigator.userAgent.toString().toLowerCase();q=navigator.appName}var G,L,H,I,J,Q;G=-1!=r.indexOf("chrome")&&-1==r.indexOf("chromium")?1:0;F=-1!=r.indexOf("chromium")?1:0;L=-1!=r.indexOf("safari")&&-1==r.indexOf("chrome")&&-1==r.indexOf("chromium")?1:0;H=-1!=r.indexOf("firefox")?1:0;r.indexOf("firefox/17");r.indexOf("firefox/15");r.indexOf("firefox/3");I=-1!=r.indexOf("opera")?
1:0;r.indexOf("msie 10");r.indexOf("msie 9");J=-1!=r.indexOf("msie 8")?1:0;Q=-1!=r.indexOf("msie 7")?1:0;r=-1!=r.indexOf("msie ")?1:0;d.biginteger_used=null;"Microsoft Internet Explorer"==q?(k.prototype.am=S,q=30):"Netscape"!=q?(k.prototype.am=R,q=26):(k.prototype.am=T,q=28);k.prototype.DB=q;k.prototype.DM=(1<<q)-1;k.prototype.DV=1<<q;k.prototype.FV=Math.pow(2,52);k.prototype.F1=52-q;k.prototype.F2=2*q-52;var D=[],w;q=48;for(w=0;9>=w;++w)D[q++]=w;q=97;for(w=10;36>w;++w)D[q++]=w;q=65;for(w=10;36>w;++w)D[q++]=
w;A.prototype.convert=function(a){return 0>a.s||0<=a.compareTo(this.m)?a.mod(this.m):a};A.prototype.revert=function(a){return a};A.prototype.reduce=function(a){a.divRemTo(this.m,null,a)};A.prototype.mulTo=function(a,b,c){a.multiplyTo(b,c);this.reduce(c)};A.prototype.sqrTo=function(a,b){a.squareTo(b);this.reduce(b)};B.prototype.convert=function(a){var b=m();a.abs().dlShiftTo(this.m.t,b);b.divRemTo(this.m,null,b);0>a.s&&0<b.compareTo(k.ZERO)&&this.m.subTo(b,b);return b};B.prototype.revert=function(a){var b=
m();a.copyTo(b);this.reduce(b);return b};B.prototype.reduce=function(a){for(;a.t<=this.mt2;)a[a.t++]=0;for(var b=0;b<this.m.t;++b){var c=a[b]&32767,e=c*this.mpl+((c*this.mph+(a[b]>>15)*this.mpl&this.um)<<15)&a.DM,c=b+this.m.t;for(a[c]+=this.m.am(0,e,a,b,0,this.m.t);a[c]>=a.DV;)a[c]-=a.DV,a[++c]++}a.clamp();a.drShiftTo(this.m.t,a);0<=a.compareTo(this.m)&&a.subTo(this.m,a)};B.prototype.mulTo=function(a,b,c){a.multiplyTo(b,c);this.reduce(c)};B.prototype.sqrTo=function(a,b){a.squareTo(b);this.reduce(b)};
k.prototype.copyTo=function(a){for(var b=this.t-1;0<=b;--b)a[b]=this[b];a.t=this.t;a.s=this.s};k.prototype.fromInt=function(a){this.t=1;this.s=0>a?-1:0;0<a?this[0]=a:-1>a?this[0]=a+this.DV:this.t=0};k.prototype.fromString=function(a,b){var c;if(16==b)c=4;else if(8==b)c=3;else if(256==b)c=8;else if(2==b)c=1;else if(32==b)c=5;else if(4==b)c=2;else{this.fromRadix(a,b);return}this.s=this.t=0;for(var e=a.length,d=!1,g=0;0<=--e;){var h=8==c?a[e]&255:M(a,e);0>h?"-"==a.charAt(e)&&(d=!0):(d=!1,0==g?this[this.t++]=
h:g+c>this.DB?(this[this.t-1]|=(h&(1<<this.DB-g)-1)<<g,this[this.t++]=h>>this.DB-g):this[this.t-1]|=h<<g,g+=c,g>=this.DB&&(g-=this.DB))}8==c&&0!=(a[0]&128)&&(this.s=-1,0<g&&(this[this.t-1]|=(1<<this.DB-g)-1<<g));this.clamp();d&&k.ZERO.subTo(this,this)};k.prototype.clamp=function(){for(var a=this.s&this.DM;0<this.t&&this[this.t-1]==a;)--this.t};k.prototype.dlShiftTo=function(a,b){var c;for(c=this.t-1;0<=c;--c)b[c+a]=this[c];for(c=a-1;0<=c;--c)b[c]=0;b.t=this.t+a;b.s=this.s};k.prototype.drShiftTo=function(a,
b){for(var c=a;c<this.t;++c)b[c-a]=this[c];b.t=Math.max(this.t-a,0);b.s=this.s};k.prototype.lShiftTo=function(a,b){var c=a%this.DB,e=this.DB-c,d=(1<<e)-1,g=Math.floor(a/this.DB),h=this.s<<c&this.DM,l;for(l=this.t-1;0<=l;--l)b[l+g+1]=this[l]>>e|h,h=(this[l]&d)<<c;for(l=g-1;0<=l;--l)b[l]=0;b[g]=h;b.t=this.t+g+1;b.s=this.s;b.clamp()};k.prototype.rShiftTo=function(a,b){b.s=this.s;var c=Math.floor(a/this.DB);if(c>=this.t)b.t=0;else{var e=a%this.DB,d=this.DB-e,g=(1<<e)-1;b[0]=this[c]>>e;for(var h=c+1;h<
this.t;++h)b[h-c-1]|=(this[h]&g)<<d,b[h-c]=this[h]>>e;0<e&&(b[this.t-c-1]|=(this.s&g)<<d);b.t=this.t-c;b.clamp()}};k.prototype.subTo=function(a,b){for(var c=0,e=0,d=Math.min(a.t,this.t);c<d;)e+=this[c]-a[c],b[c++]=e&this.DM,e>>=this.DB;if(a.t<this.t){for(e-=a.s;c<this.t;)e+=this[c],b[c++]=e&this.DM,e>>=this.DB;e+=this.s}else{for(e+=this.s;c<a.t;)e-=a[c],b[c++]=e&this.DM,e>>=this.DB;e-=a.s}b.s=0>e?-1:0;-1>e?b[c++]=this.DV+e:0<e&&(b[c++]=e);b.t=c;b.clamp()};k.prototype.multiplyTo=function(a,b){var c=
this.abs(),e=a.abs(),d=c.t;for(b.t=d+e.t;0<=--d;)b[d]=0;for(d=0;d<e.t;++d)b[d+c.t]=c.am(0,e[d],b,d,0,c.t);b.s=0;b.clamp();this.s!=a.s&&k.ZERO.subTo(b,b)};k.prototype.squareTo=function(a){for(var b=this.abs(),c=a.t=2*b.t;0<=--c;)a[c]=0;for(c=0;c<b.t-1;++c){var e=b.am(c,b[c],a,2*c,0,1);(a[c+b.t]+=b.am(c+1,2*b[c],a,2*c+1,e,b.t-c-1))>=b.DV&&(a[c+b.t]-=b.DV,a[c+b.t+1]=1)}0<a.t&&(a[a.t-1]+=b.am(c,b[c],a,2*c,0,1));a.s=0;a.clamp()};k.prototype.divRemTo=function(a,b,c){var e=a.abs();if(!(0>=e.t)){var d=this.abs();
if(d.t<e.t)null!=b&&b.fromInt(0),null!=c&&this.copyTo(c);else{null==c&&(c=m());var g=m(),h=this.s;a=a.s;var l=this.DB-E(e[e.t-1]);0<l?(e.lShiftTo(l,g),d.lShiftTo(l,c)):(e.copyTo(g),d.copyTo(c));e=g.t;d=g[e-1];if(0!=d){var v=d*(1<<this.F1)+(1<e?g[e-2]>>this.F2:0),n=this.FV/v,v=(1<<this.F1)/v,p=1<<this.F2,y=c.t,q=y-e,t=null==b?m():b;g.dlShiftTo(q,t);0<=c.compareTo(t)&&(c[c.t++]=1,c.subTo(t,c));k.ONE.dlShiftTo(e,t);for(t.subTo(g,g);g.t<e;)g[g.t++]=0;for(;0<=--q;){var r=c[--y]==d?this.DM:Math.floor(c[y]*
n+(c[y-1]+p)*v);if((c[y]+=g.am(0,r,c,q,0,e))<r)for(g.dlShiftTo(q,t),c.subTo(t,c);c[y]<--r;)c.subTo(t,c)}null!=b&&(c.drShiftTo(e,b),h!=a&&k.ZERO.subTo(b,b));c.t=e;c.clamp();0<l&&c.rShiftTo(l,c);0>h&&k.ZERO.subTo(c,c)}}}};k.prototype.invDigit=function(){if(1>this.t)return 0;var a=this[0];if(0==(a&1))return 0;var b=a&3,b=b*(2-(a&15)*b)&15,b=b*(2-(a&255)*b)&255,b=b*(2-((a&65535)*b&65535))&65535,b=b*(2-a*b%this.DV)%this.DV;return 0<b?this.DV-b:-b};k.prototype.isEven=function(){return 0==(0<this.t?this[0]&
1:this.s)};k.prototype.exp=function(a,b){if(4294967295<a||1>a)return k.ONE;var c=m(),e=m(),d=b.convert(this),g=E(a)-1;for(d.copyTo(c);0<=--g;)if(b.sqrTo(c,e),0<(a&1<<g))b.mulTo(e,d,c);else var h=c,c=e,e=h;return b.revert(c)};k.prototype.toString=function(a){if(0>this.s)return"-"+this.negate().toString(a);if(16==a)a=4;else if(8==a)a=3;else if(2==a)a=1;else if(32==a)a=5;else if(4==a)a=2;else return this.toRadix(a);var b=(1<<a)-1,c,e=!1,d="",g=this.t,h=this.DB-g*this.DB%a;if(0<g--)for(h<this.DB&&0<(c=
this[g]>>h)&&(e=!0,d="0123456789abcdefghijklmnopqrstuvwxyz".charAt(c));0<=g;)h<a?(c=(this[g]&(1<<h)-1)<<a-h,c|=this[--g]>>(h+=this.DB-a)):(c=this[g]>>(h-=a)&b,0>=h&&(h+=this.DB,--g)),0<c&&(e=!0),e&&(d+="0123456789abcdefghijklmnopqrstuvwxyz".charAt(c));return e?d:"0"};k.prototype.negate=function(){var a=m();k.ZERO.subTo(this,a);return a};k.prototype.abs=function(){return 0>this.s?this.negate():this};k.prototype.compareTo=function(a){var b=this.s-a.s;if(0!=b)return b;var c=this.t,b=c-a.t;if(0!=b)return 0>
this.s?-b:b;for(;0<=--c;)if(0!=(b=this[c]-a[c]))return b;return 0};k.prototype.bitLength=function(){return 0>=this.t?0:this.DB*(this.t-1)+E(this[this.t-1]^this.s&this.DM)};k.prototype.mod=function(a){var b=m();this.abs().divRemTo(a,null,b);0>this.s&&0<b.compareTo(k.ZERO)&&a.subTo(b,b);return b};k.prototype.modPowInt=function(a,b){var c;c=256>a||b.isEven()?new A(b):new B(b);return this.exp(a,c)};k.ZERO=x(0);k.ONE=x(1);C.prototype.convert=P;C.prototype.revert=P;C.prototype.mulTo=function(a,b,c){a.multiplyTo(b,
c)};C.prototype.sqrTo=function(a,b){a.squareTo(b)};z.prototype.convert=function(a){if(0>a.s||a.t>2*this.m.t)return a.mod(this.m);if(0>a.compareTo(this.m))return a;var b=m();a.copyTo(b);this.reduce(b);return b};z.prototype.revert=function(a){return a};z.prototype.reduce=function(a){a.drShiftTo(this.m.t-1,this.r2);a.t>this.m.t+1&&(a.t=this.m.t+1,a.clamp());this.mu.multiplyUpperTo(this.r2,this.m.t+1,this.q3);for(this.m.multiplyLowerTo(this.q3,this.m.t+1,this.r2);0>a.compareTo(this.r2);)a.dAddOffset(1,
this.m.t+1);for(a.subTo(this.r2,a);0<=a.compareTo(this.m);)a.subTo(this.m,a)};z.prototype.mulTo=function(a,b,c){a.multiplyTo(b,c);this.reduce(c)};z.prototype.sqrTo=function(a,b){a.squareTo(b);this.reduce(b)};var u=[2,3,5,7,11,13,17,19,23,29,31,37,41,43,47,53,59,61,67,71,73,79,83,89,97,101,103,107,109,113,127,131,137,139,149,151,157,163,167,173,179,181,191,193,197,199,211,223,227,229,233,239,241,251,257,263,269,271,277,281,283,293,307,311,313,317,331,337,347,349,353,359,367,373,379,383,389,397,401,
409,419,421,431,433,439,443,449,457,461,463,467,479,487,491,499,503,509,521,523,541,547,557,563,569,571,577,587,593,599,601,607,613,617,619,631,641,643,647,653,659,661,673,677,683,691,701,709,719,727,733,739,743,751,757,761,769,773,787,797,809,811,821,823,827,829,839,853,857,859,863,877,881,883,887,907,911,919,929,937,941,947,953,967,971,977,983,991,997],V=67108864/u[u.length-1];k.prototype.chunkSize=function(a){return Math.floor(Math.LN2*this.DB/Math.log(a))};k.prototype.toRadix=function(a){null==
a&&(a=10);if(0==this.signum()||2>a||36<a)return"0";var b=this.chunkSize(a),b=Math.pow(a,b),c=x(b),e=m(),d=m(),g="";for(this.divRemTo(c,e,d);0<e.signum();)g=(b+d.intValue()).toString(a).substr(1)+g,e.divRemTo(c,e,d);return d.intValue().toString(a)+g};k.prototype.fromRadix=function(a,b){this.fromInt(0);null==b&&(b=10);for(var c=this.chunkSize(b),e=Math.pow(b,c),d=!1,g=0,h=0,l=0;l<a.length;++l){var v=M(a,l);0>v?"-"==a.charAt(l)&&0==this.signum()&&(d=!0):(h=b*h+v,++g>=c&&(this.dMultiply(e),this.dAddOffset(h,
0),h=g=0))}0<g&&(this.dMultiply(Math.pow(b,g)),this.dAddOffset(h,0));d&&k.ZERO.subTo(this,this)};k.prototype.fromNumber=function(a,b,c){if("number"==typeof b)if(2>a)this.fromInt(1);else for(this.fromNumber(a,c),this.testBit(a-1)||this.bitwiseTo(k.ONE.shiftLeft(a-1),K,this),this.isEven()&&this.dAddOffset(1,0);!this.isProbablePrime(b);)this.dAddOffset(2,0),this.bitLength()>a&&this.subTo(k.ONE.shiftLeft(a-1),this);else{c=[];var e=a&7;c.length=(a>>3)+1;b.nextBytes(c);c[0]=0<e?c[0]&(1<<e)-1:0;this.fromString(c,
256)}};k.prototype.bitwiseTo=function(a,b,c){var e,d,g=Math.min(a.t,this.t);for(e=0;e<g;++e)c[e]=b(this[e],a[e]);if(a.t<this.t){d=a.s&this.DM;for(e=g;e<this.t;++e)c[e]=b(this[e],d);c.t=this.t}else{d=this.s&this.DM;for(e=g;e<a.t;++e)c[e]=b(d,a[e]);c.t=a.t}c.s=b(this.s,a.s);c.clamp()};k.prototype.changeBit=function(a,b){var c=k.ONE.shiftLeft(a);this.bitwiseTo(c,b,c);return c};k.prototype.addTo=function(a,b){for(var c=0,e=0,d=Math.min(a.t,this.t);c<d;)e+=this[c]+a[c],b[c++]=e&this.DM,e>>=this.DB;if(a.t<
this.t){for(e+=a.s;c<this.t;)e+=this[c],b[c++]=e&this.DM,e>>=this.DB;e+=this.s}else{for(e+=this.s;c<a.t;)e+=a[c],b[c++]=e&this.DM,e>>=this.DB;e+=a.s}b.s=0>e?-1:0;0<e?b[c++]=e:-1>e&&(b[c++]=this.DV+e);b.t=c;b.clamp()};k.prototype.dMultiply=function(a){this[this.t]=this.am(0,a-1,this,0,0,this.t);++this.t;this.clamp()};k.prototype.dAddOffset=function(a,b){if(0!=a){for(;this.t<=b;)this[this.t++]=0;for(this[b]+=a;this[b]>=this.DV;)this[b]-=this.DV,++b>=this.t&&(this[this.t++]=0),++this[b]}};k.prototype.multiplyLowerTo=
function(a,b,c){var e=Math.min(this.t+a.t,b);c.s=0;for(c.t=e;0<e;)c[--e]=0;var d;for(d=c.t-this.t;e<d;++e)c[e+this.t]=this.am(0,a[e],c,e,0,this.t);for(d=Math.min(a.t,b);e<d;++e)this.am(0,a[e],c,e,0,b-e);c.clamp()};k.prototype.multiplyUpperTo=function(a,b,c){--b;var e=c.t=this.t+a.t-b;for(c.s=0;0<=--e;)c[e]=0;for(e=Math.max(b-this.t,0);e<a.t;++e)c[this.t+e-b]=this.am(b-e,a[e],c,0,0,this.t+e-b);c.clamp();c.drShiftTo(1,c)};k.prototype.modInt=function(a){if(0>=a)return 0;var b=this.DV%a,c=0>this.s?a-
1:0;if(0<this.t)if(0==b)c=this[0]%a;else for(var e=this.t-1;0<=e;--e)c=(b*c+this[e])%a;return c};k.prototype.millerRabin=function(a){var b=this.subtract(k.ONE),c=b.getLowestSetBit();if(0>=c)return!1;var e=b.shiftRight(c);a=a+1>>1;a>u.length&&(a=u.length);for(var d=m(),g=0;g<a;++g){d.fromInt(u[Math.floor(Math.random()*u.length)]);var h=d.modPow(e,this);if(0!=h.compareTo(k.ONE)&&0!=h.compareTo(b)){for(var l=1;l++<c&&0!=h.compareTo(b);)if(h=h.modPowInt(2,this),0==h.compareTo(k.ONE))return!1;if(0!=h.compareTo(b))return!1}}return!0};
k.prototype.clone=function(){var a=m();this.copyTo(a);return a};k.prototype.intValue=function(){if(0>this.s){if(1==this.t)return this[0]-this.DV;if(0==this.t)return-1}else{if(1==this.t)return this[0];if(0==this.t)return 0}return(this[1]&(1<<32-this.DB)-1)<<this.DB|this[0]};k.prototype.byteValue=function(){return 0==this.t?this.s:this[0]<<24>>24};k.prototype.shortValue=function(){return 0==this.t?this.s:this[0]<<16>>16};k.prototype.signum=function(){return 0>this.s?-1:0>=this.t||1==this.t&&0>=this[0]?
0:1};k.prototype.toByteArray=function(){var a=this.t,b=[];b[0]=this.s;var c=this.DB-a*this.DB%8,e,d=0;if(0<a--)for(c<this.DB&&(e=this[a]>>c)!=(this.s&this.DM)>>c&&(b[d++]=e|this.s<<this.DB-c);0<=a;)if(8>c?(e=(this[a]&(1<<c)-1)<<8-c,e|=this[--a]>>(c+=this.DB-8)):(e=this[a]>>(c-=8)&255,0>=c&&(c+=this.DB,--a)),0!=(e&128)&&(e|=-256),0==d&&(this.s&128)!=(e&128)&&++d,0<d||e!=this.s)b[d++]=e;return b};k.prototype.equals=function(a){return 0==this.compareTo(a)};k.prototype.min=function(a){return 0>this.compareTo(a)?
this:a};k.prototype.max=function(a){return 0<this.compareTo(a)?this:a};k.prototype.and=function(a){var b=m();this.bitwiseTo(a,U,b);return b};k.prototype.or=function(a){var b=m();this.bitwiseTo(a,K,b);return b};k.prototype.xor=function(a){var b=m();this.bitwiseTo(a,N,b);return b};k.prototype.andNot=function(a){var b=m();this.bitwiseTo(a,O,b);return b};k.prototype.not=function(){for(var a=m(),b=0;b<this.t;++b)a[b]=this.DM&~this[b];a.t=this.t;a.s=~this.s;return a};k.prototype.shiftLeft=function(a){var b=
m();0>a?this.rShiftTo(-a,b):this.lShiftTo(a,b);return b};k.prototype.shiftRight=function(a){var b=m();0>a?this.lShiftTo(-a,b):this.rShiftTo(a,b);return b};k.prototype.getLowestSetBit=function(){for(var a=0;a<this.t;++a)if(0!=this[a]){var b=a*this.DB;a=this[a];if(0==a)a=-1;else{var c=0;0==(a&65535)&&(a>>=16,c+=16);0==(a&255)&&(a>>=8,c+=8);0==(a&15)&&(a>>=4,c+=4);0==(a&3)&&(a>>=2,c+=2);0==(a&1)&&++c;a=c}return b+a}return 0>this.s?this.t*this.DB:-1};k.prototype.bitCount=function(){for(var a=0,b=this.s&
this.DM,c=0;c<this.t;++c){for(var e=this[c]^b,d=0;0!=e;)e&=e-1,++d;a+=d}return a};k.prototype.testBit=function(a){var b=Math.floor(a/this.DB);return b>=this.t?0!=this.s:0!=(this[b]&1<<a%this.DB)};k.prototype.setBit=function(a){return this.changeBit(a,K)};k.prototype.clearBit=function(a){return this.changeBit(a,O)};k.prototype.flipBit=function(a){return this.changeBit(a,N)};k.prototype.add=function(a){var b=m();this.addTo(a,b);return b};k.prototype.subtract=function(a){var b=m();this.subTo(a,b);return b};
k.prototype.multiply=function(a){var b=m();this.multiplyTo(a,b);return b};k.prototype.divide=function(a){var b=m();this.divRemTo(a,b,null);return b};k.prototype.remainder=function(a){var b=m();this.divRemTo(a,null,b);return b};k.prototype.divideAndRemainder=function(a){var b=m(),c=m();this.divRemTo(a,b,c);return[b,c]};k.prototype.modPow=function(a,b){var c=a.bitLength(),e,d=x(1),g;if(0>=c)return d;e=18>c?1:48>c?3:144>c?4:768>c?5:6;g=8>c?new A(b):b.isEven()?new z(b):new B(b);var h=[],l=3,k=e-1,n=(1<<
e)-1;h[1]=g.convert(this);if(1<e)for(c=m(),g.sqrTo(h[1],c);l<=n;)h[l]=m(),g.mulTo(c,h[l-2],h[l]),l+=2;for(var p=a.t-1,y,q=!0,t=m(),c=E(a[p])-1;0<=p;){c>=k?y=a[p]>>c-k&n:(y=(a[p]&(1<<c+1)-1)<<k-c,0<p&&(y|=a[p-1]>>this.DB+c-k));for(l=e;0==(y&1);)y>>=1,--l;0>(c-=l)&&(c+=this.DB,--p);if(q)h[y].copyTo(d),q=!1;else{for(;1<l;)g.sqrTo(d,t),g.sqrTo(t,d),l-=2;0<l?g.sqrTo(d,t):(l=d,d=t,t=l);g.mulTo(t,h[y],d)}for(;0<=p&&0==(a[p]&1<<c);)g.sqrTo(d,t),l=d,d=t,t=l,0>--c&&(c=this.DB-1,--p)}return g.revert(d)};k.prototype.modInverse=
function(a){var b=a.isEven();if(this.isEven()&&b||0==a.signum())return k.ZERO;for(var c=a.clone(),e=this.clone(),d=x(1),g=x(0),h=x(0),l=x(1);0!=c.signum();){for(;c.isEven();)c.rShiftTo(1,c),b?(d.isEven()&&g.isEven()||(d.addTo(this,d),g.subTo(a,g)),d.rShiftTo(1,d)):g.isEven()||g.subTo(a,g),g.rShiftTo(1,g);for(;e.isEven();)e.rShiftTo(1,e),b?(h.isEven()&&l.isEven()||(h.addTo(this,h),l.subTo(a,l)),h.rShiftTo(1,h)):l.isEven()||l.subTo(a,l),l.rShiftTo(1,l);0<=c.compareTo(e)?(c.subTo(e,c),b&&d.subTo(h,d),
g.subTo(l,g)):(e.subTo(c,e),b&&h.subTo(d,h),l.subTo(g,l))}if(0!=e.compareTo(k.ONE))return k.ZERO;if(0<=l.compareTo(a))return l.subtract(a);if(0>l.signum())l.addTo(a,l);else return l;return 0>l.signum()?l.add(a):l};k.prototype.pow=function(a){return this.exp(a,new C)};k.prototype.gcd=function(a){var b=0>this.s?this.negate():this.clone();a=0>a.s?a.negate():a.clone();if(0>b.compareTo(a)){var c=b,b=a;a=c}var c=b.getLowestSetBit(),e=a.getLowestSetBit();if(0>e)return b;c<e&&(e=c);0<e&&(b.rShiftTo(e,b),
a.rShiftTo(e,a));for(;0<b.signum();)0<(c=b.getLowestSetBit())&&b.rShiftTo(c,b),0<(c=a.getLowestSetBit())&&a.rShiftTo(c,a),0<=b.compareTo(a)?(b.subTo(a,b),b.rShiftTo(1,b)):(a.subTo(b,a),a.rShiftTo(1,a));0<e&&a.lShiftTo(e,a);return a};k.prototype.isProbablePrime=function(a){var b,c=this.abs();if(1==c.t&&c[0]<=u[u.length-1]){for(b=0;b<u.length;++b)if(c[0]==u[b])return!0;return!1}if(c.isEven())return!1;for(b=1;b<u.length;){for(var e=u[b],d=b+1;d<u.length&&e<V;)e*=u[d++];for(e=c.modInt(e);b<d;)if(0==e%
u[b++])return!1}return c.millerRabin(a)};k.prototype.square=function(){var a=m();this.squareTo(a);return a};k.prototype.IsNegative=function(){return-1==this.compareTo(k.ZERO)?!0:!1};k.op_Equality=function(a,b){return 0==a.compareTo(b)?!0:!1};k.op_Inequality=function(a,b){return 0!=a.compareTo(b)?!0:!1};k.op_GreaterThan=function(a,b){return 0<a.compareTo(b)?!0:!1};k.op_LessThan=function(a,b){return 0>a.compareTo(b)?!0:!1};k.op_Addition=function(a,b){return(new k(a)).add(new k(b))};k.op_Subtraction=
function(a,b){return(new k(a)).subtract(new k(b))};k.Int128Mul=function(a,b){return(new k(a)).multiply(new k(b))};k.op_Division=function(a,b){return a.divide(b)};k.prototype.ToDouble=function(){return parseFloat(this.toString())};q=function(a,b){var c;if("undefined"==typeof Object.getOwnPropertyNames)for(c in b.prototype){if("undefined"==typeof a.prototype[c]||a.prototype[c]==Object.prototype[c])a.prototype[c]=b.prototype[c]}else for(var e=Object.getOwnPropertyNames(b.prototype),d=0;d<e.length;d++)"undefined"==
typeof Object.getOwnPropertyDescriptor(a.prototype,e[d])&&Object.defineProperty(a.prototype,e[d],Object.getOwnPropertyDescriptor(b.prototype,e[d]));for(c in b)"undefined"==typeof a[c]&&(a[c]=b[c]);a.$baseCtor=b};d.Path=function(){return[]};d.Paths=function(){return[]};d.DoublePoint=function(){var a=arguments;this.Y=this.X=0;1==a.length?(this.X=a[0].X,this.Y=a[0].Y):2==a.length&&(this.X=a[0],this.Y=a[1])};d.DoublePoint0=function(){this.Y=this.X=0};d.DoublePoint1=function(a){this.X=a.X;this.Y=a.Y};
d.DoublePoint2=function(a,b){this.X=a;this.Y=b};d.PolyNode=function(){this.m_Parent=null;this.m_polygon=new d.Path;this.m_endtype=this.m_jointype=this.m_Index=0;this.m_Childs=[];this.IsOpen=!1};d.PolyNode.prototype.IsHoleNode=function(){for(var a=!0,b=this.m_Parent;null!==b;)a=!a,b=b.m_Parent;return a};d.PolyNode.prototype.ChildCount=function(){return this.m_Childs.length};d.PolyNode.prototype.Contour=function(){return this.m_polygon};d.PolyNode.prototype.AddChild=function(a){var b=this.m_Childs.length;
this.m_Childs.push(a);a.m_Parent=this;a.m_Index=b};d.PolyNode.prototype.GetNext=function(){return 0<this.m_Childs.length?this.m_Childs[0]:this.GetNextSiblingUp()};d.PolyNode.prototype.GetNextSiblingUp=function(){return null===this.m_Parent?null:this.m_Index==this.m_Parent.m_Childs.length-1?this.m_Parent.GetNextSiblingUp():this.m_Parent.m_Childs[this.m_Index+1]};d.PolyNode.prototype.Childs=function(){return this.m_Childs};d.PolyNode.prototype.Parent=function(){return this.m_Parent};d.PolyNode.prototype.IsHole=
function(){return this.IsHoleNode()};d.PolyTree=function(){this.m_AllPolys=[];d.PolyNode.call(this)};d.PolyTree.prototype.Clear=function(){for(var a=0,b=this.m_AllPolys.length;a<b;a++)this.m_AllPolys[a]=null;this.m_AllPolys.length=0;this.m_Childs.length=0};d.PolyTree.prototype.GetFirst=function(){return 0<this.m_Childs.length?this.m_Childs[0]:null};d.PolyTree.prototype.Total=function(){var a=this.m_AllPolys.length;0<a&&this.m_Childs[0]!=this.m_AllPolys[0]&&a--;return a};q(d.PolyTree,d.PolyNode);d.Math_Abs_Int64=
d.Math_Abs_Int32=d.Math_Abs_Double=function(a){return Math.abs(a)};d.Math_Max_Int32_Int32=function(a,b){return Math.max(a,b)};d.Cast_Int32=r||I||L?function(a){return a|0}:function(a){return~~a};d.Cast_Int64=G?function(a){return-2147483648>a||2147483647<a?0>a?Math.ceil(a):Math.floor(a):~~a}:H&&"function"==typeof Number.toInteger?function(a){return Number.toInteger(a)}:Q||J?function(a){return parseInt(a,10)}:r?function(a){return-2147483648>a||2147483647<a?0>a?Math.ceil(a):Math.floor(a):a|0}:function(a){return 0>
a?Math.ceil(a):Math.floor(a)};d.Clear=function(a){a.length=0};d.PI=3.141592653589793;d.PI2=6.283185307179586;d.IntPoint=function(){var a;a=arguments;var b=a.length;this.Y=this.X=0;2==b?(this.X=a[0],this.Y=a[1]):1==b?a[0]instanceof d.DoublePoint?(a=a[0],this.X=d.Clipper.Round(a.X),this.Y=d.Clipper.Round(a.Y)):(a=a[0],this.X=a.X,this.Y=a.Y):this.Y=this.X=0};d.IntPoint.op_Equality=function(a,b){return a.X==b.X&&a.Y==b.Y};d.IntPoint.op_Inequality=function(a,b){return a.X!=b.X||a.Y!=b.Y};d.IntPoint0=function(){this.Y=
this.X=0};d.IntPoint1=function(a){this.X=a.X;this.Y=a.Y};d.IntPoint1dp=function(a){this.X=d.Clipper.Round(a.X);this.Y=d.Clipper.Round(a.Y)};d.IntPoint2=function(a,b){this.X=a;this.Y=b};d.IntRect=function(){var a=arguments,b=a.length;4==b?(this.left=a[0],this.top=a[1],this.right=a[2],this.bottom=a[3]):1==b?(this.left=ir.left,this.top=ir.top,this.right=ir.right,this.bottom=ir.bottom):this.bottom=this.right=this.top=this.left=0};d.IntRect0=function(){this.bottom=this.right=this.top=this.left=0};d.IntRect1=
function(a){this.left=a.left;this.top=a.top;this.right=a.right;this.bottom=a.bottom};d.IntRect4=function(a,b,c,e){this.left=a;this.top=b;this.right=c;this.bottom=e};d.ClipType={ctIntersection:0,ctUnion:1,ctDifference:2,ctXor:3};d.PolyType={ptSubject:0,ptClip:1};d.PolyFillType={pftEvenOdd:0,pftNonZero:1,pftPositive:2,pftNegative:3};d.JoinType={jtSquare:0,jtRound:1,jtMiter:2};d.EndType={etOpenSquare:0,etOpenRound:1,etOpenButt:2,etClosedLine:3,etClosedPolygon:4};d.EdgeSide={esLeft:0,esRight:1};d.Direction=
{dRightToLeft:0,dLeftToRight:1};d.TEdge=function(){this.Bot=new d.IntPoint;this.Curr=new d.IntPoint;this.Top=new d.IntPoint;this.Delta=new d.IntPoint;this.Dx=0;this.PolyTyp=d.PolyType.ptSubject;this.Side=d.EdgeSide.esLeft;this.OutIdx=this.WindCnt2=this.WindCnt=this.WindDelta=0;this.PrevInSEL=this.NextInSEL=this.PrevInAEL=this.NextInAEL=this.NextInLML=this.Prev=this.Next=null};d.IntersectNode=function(){this.Edge2=this.Edge1=null;this.Pt=new d.IntPoint};d.MyIntersectNodeSort=function(){};d.MyIntersectNodeSort.Compare=
function(a,b){var c=b.Pt.Y-a.Pt.Y;return 0<c?1:0>c?-1:0};d.LocalMinima=function(){this.Y=0;this.Next=this.RightBound=this.LeftBound=null};d.Scanbeam=function(){this.Y=0;this.Next=null};d.OutRec=function(){this.Idx=0;this.IsOpen=this.IsHole=!1;this.PolyNode=this.BottomPt=this.Pts=this.FirstLeft=null};d.OutPt=function(){this.Idx=0;this.Pt=new d.IntPoint;this.Prev=this.Next=null};d.Join=function(){this.OutPt2=this.OutPt1=null;this.OffPt=new d.IntPoint};d.ClipperBase=function(){this.m_CurrentLM=this.m_MinimaList=
null;this.m_edges=[];this.PreserveCollinear=this.m_HasOpenPaths=this.m_UseFullRange=!1;this.m_CurrentLM=this.m_MinimaList=null;this.m_HasOpenPaths=this.m_UseFullRange=!1};d.ClipperBase.horizontal=-9007199254740992;d.ClipperBase.Skip=-2;d.ClipperBase.Unassigned=-1;d.ClipperBase.tolerance=1E-20;d.ClipperBase.loRange=47453132;d.ClipperBase.hiRange=0xfffffffffffff;d.ClipperBase.near_zero=function(a){return a>-d.ClipperBase.tolerance&&a<d.ClipperBase.tolerance};d.ClipperBase.IsHorizontal=function(a){return 0===
a.Delta.Y};d.ClipperBase.prototype.PointIsVertex=function(a,b){var c=b;do{if(d.IntPoint.op_Equality(c.Pt,a))return!0;c=c.Next}while(c!=b);return!1};d.ClipperBase.prototype.PointOnLineSegment=function(a,b,c,e){return e?a.X==b.X&&a.Y==b.Y||a.X==c.X&&a.Y==c.Y||a.X>b.X==a.X<c.X&&a.Y>b.Y==a.Y<c.Y&&k.op_Equality(k.Int128Mul(a.X-b.X,c.Y-b.Y),k.Int128Mul(c.X-b.X,a.Y-b.Y)):a.X==b.X&&a.Y==b.Y||a.X==c.X&&a.Y==c.Y||a.X>b.X==a.X<c.X&&a.Y>b.Y==a.Y<c.Y&&(a.X-b.X)*(c.Y-b.Y)==(c.X-b.X)*(a.Y-b.Y)};d.ClipperBase.prototype.PointOnPolygon=
function(a,b,c){for(var e=b;;){if(this.PointOnLineSegment(a,e.Pt,e.Next.Pt,c))return!0;e=e.Next;if(e==b)break}return!1};d.ClipperBase.prototype.SlopesEqual=d.ClipperBase.SlopesEqual=function(){var a=arguments,b=a.length,c,e,f;if(3==b)return b=a[0],c=a[1],(a=a[2])?k.op_Equality(k.Int128Mul(b.Delta.Y,c.Delta.X),k.Int128Mul(b.Delta.X,c.Delta.Y)):d.Cast_Int64(b.Delta.Y*c.Delta.X)==d.Cast_Int64(b.Delta.X*c.Delta.Y);if(4==b)return b=a[0],c=a[1],e=a[2],(a=a[3])?k.op_Equality(k.Int128Mul(b.Y-c.Y,c.X-e.X),
k.Int128Mul(b.X-c.X,c.Y-e.Y)):0===d.Cast_Int64((b.Y-c.Y)*(c.X-e.X))-d.Cast_Int64((b.X-c.X)*(c.Y-e.Y));b=a[0];c=a[1];e=a[2];f=a[3];return(a=a[4])?k.op_Equality(k.Int128Mul(b.Y-c.Y,e.X-f.X),k.Int128Mul(b.X-c.X,e.Y-f.Y)):0===d.Cast_Int64((b.Y-c.Y)*(e.X-f.X))-d.Cast_Int64((b.X-c.X)*(e.Y-f.Y))};d.ClipperBase.SlopesEqual3=function(a,b,c){return c?k.op_Equality(k.Int128Mul(a.Delta.Y,b.Delta.X),k.Int128Mul(a.Delta.X,b.Delta.Y)):d.Cast_Int64(a.Delta.Y*b.Delta.X)==d.Cast_Int64(a.Delta.X*b.Delta.Y)};d.ClipperBase.SlopesEqual4=
function(a,b,c,e){return e?k.op_Equality(k.Int128Mul(a.Y-b.Y,b.X-c.X),k.Int128Mul(a.X-b.X,b.Y-c.Y)):0===d.Cast_Int64((a.Y-b.Y)*(b.X-c.X))-d.Cast_Int64((a.X-b.X)*(b.Y-c.Y))};d.ClipperBase.SlopesEqual5=function(a,b,c,e,f){return f?k.op_Equality(k.Int128Mul(a.Y-b.Y,c.X-e.X),k.Int128Mul(a.X-b.X,c.Y-e.Y)):0===d.Cast_Int64((a.Y-b.Y)*(c.X-e.X))-d.Cast_Int64((a.X-b.X)*(c.Y-e.Y))};d.ClipperBase.prototype.Clear=function(){this.DisposeLocalMinimaList();for(var a=0,b=this.m_edges.length;a<b;++a){for(var c=0,
e=this.m_edges[a].length;c<e;++c)this.m_edges[a][c]=null;d.Clear(this.m_edges[a])}d.Clear(this.m_edges);this.m_HasOpenPaths=this.m_UseFullRange=!1};d.ClipperBase.prototype.DisposeLocalMinimaList=function(){for(;null!==this.m_MinimaList;){var a=this.m_MinimaList.Next;this.m_MinimaList=null;this.m_MinimaList=a}this.m_CurrentLM=null};d.ClipperBase.prototype.RangeTest=function(a,b){if(b.Value)(a.X>d.ClipperBase.hiRange||a.Y>d.ClipperBase.hiRange||-a.X>d.ClipperBase.hiRange||-a.Y>d.ClipperBase.hiRange)&&
d.Error("Coordinate outside allowed range in RangeTest().");else if(a.X>d.ClipperBase.loRange||a.Y>d.ClipperBase.loRange||-a.X>d.ClipperBase.loRange||-a.Y>d.ClipperBase.loRange)b.Value=!0,this.RangeTest(a,b)};d.ClipperBase.prototype.InitEdge=function(a,b,c,e){a.Next=b;a.Prev=c;a.Curr.X=e.X;a.Curr.Y=e.Y;a.OutIdx=-1};d.ClipperBase.prototype.InitEdge2=function(a,b){a.Curr.Y>=a.Next.Curr.Y?(a.Bot.X=a.Curr.X,a.Bot.Y=a.Curr.Y,a.Top.X=a.Next.Curr.X,a.Top.Y=a.Next.Curr.Y):(a.Top.X=a.Curr.X,a.Top.Y=a.Curr.Y,
a.Bot.X=a.Next.Curr.X,a.Bot.Y=a.Next.Curr.Y);this.SetDx(a);a.PolyTyp=b};d.ClipperBase.prototype.FindNextLocMin=function(a){for(var b;;){for(;d.IntPoint.op_Inequality(a.Bot,a.Prev.Bot)||d.IntPoint.op_Equality(a.Curr,a.Top);)a=a.Next;if(a.Dx!=d.ClipperBase.horizontal&&a.Prev.Dx!=d.ClipperBase.horizontal)break;for(;a.Prev.Dx==d.ClipperBase.horizontal;)a=a.Prev;for(b=a;a.Dx==d.ClipperBase.horizontal;)a=a.Next;if(a.Top.Y!=a.Prev.Bot.Y){b.Prev.Bot.X<a.Bot.X&&(a=b);break}}return a};d.ClipperBase.prototype.ProcessBound=
function(a,b){var c,e=a,f;if(e.OutIdx==d.ClipperBase.Skip){a=e;if(b){for(;a.Top.Y==a.Next.Bot.Y;)a=a.Next;for(;a!=e&&a.Dx==d.ClipperBase.horizontal;)a=a.Prev}else{for(;a.Top.Y==a.Prev.Bot.Y;)a=a.Prev;for(;a!=e&&a.Dx==d.ClipperBase.horizontal;)a=a.Next}a==e?e=b?a.Next:a.Prev:(a=b?e.Next:e.Prev,c=new d.LocalMinima,c.Next=null,c.Y=a.Bot.Y,c.LeftBound=null,c.RightBound=a,a.WindDelta=0,e=this.ProcessBound(a,b),this.InsertLocalMinima(c));return e}a.Dx==d.ClipperBase.horizontal&&(c=b?a.Prev:a.Next,c.OutIdx!=
d.ClipperBase.Skip&&(c.Dx==d.ClipperBase.horizontal?c.Bot.X!=a.Bot.X&&c.Top.X!=a.Bot.X&&this.ReverseHorizontal(a):c.Bot.X!=a.Bot.X&&this.ReverseHorizontal(a)));c=a;if(b){for(;e.Top.Y==e.Next.Bot.Y&&e.Next.OutIdx!=d.ClipperBase.Skip;)e=e.Next;if(e.Dx==d.ClipperBase.horizontal&&e.Next.OutIdx!=d.ClipperBase.Skip){for(f=e;f.Prev.Dx==d.ClipperBase.horizontal;)f=f.Prev;f.Prev.Top.X==e.Next.Top.X?b||(e=f.Prev):f.Prev.Top.X>e.Next.Top.X&&(e=f.Prev)}for(;a!=e;)a.NextInLML=a.Next,a.Dx==d.ClipperBase.horizontal&&
a!=c&&a.Bot.X!=a.Prev.Top.X&&this.ReverseHorizontal(a),a=a.Next;a.Dx==d.ClipperBase.horizontal&&a!=c&&a.Bot.X!=a.Prev.Top.X&&this.ReverseHorizontal(a);e=e.Next}else{for(;e.Top.Y==e.Prev.Bot.Y&&e.Prev.OutIdx!=d.ClipperBase.Skip;)e=e.Prev;if(e.Dx==d.ClipperBase.horizontal&&e.Prev.OutIdx!=d.ClipperBase.Skip){for(f=e;f.Next.Dx==d.ClipperBase.horizontal;)f=f.Next;f.Next.Top.X==e.Prev.Top.X?b||(e=f.Next):f.Next.Top.X>e.Prev.Top.X&&(e=f.Next)}for(;a!=e;)a.NextInLML=a.Prev,a.Dx==d.ClipperBase.horizontal&&
a!=c&&a.Bot.X!=a.Next.Top.X&&this.ReverseHorizontal(a),a=a.Prev;a.Dx==d.ClipperBase.horizontal&&a!=c&&a.Bot.X!=a.Next.Top.X&&this.ReverseHorizontal(a);e=e.Prev}return e};d.ClipperBase.prototype.AddPath=function(a,b,c){c||b!=d.PolyType.ptClip||d.Error("AddPath: Open paths must be subject.");var e=a.length-1;if(c)for(;0<e&&d.IntPoint.op_Equality(a[e],a[0]);)--e;for(;0<e&&d.IntPoint.op_Equality(a[e],a[e-1]);)--e;if(c&&2>e||!c&&1>e)return!1;for(var f=[],g=0;g<=e;g++)f.push(new d.TEdge);var h=!0;f[1].Curr.X=
a[1].X;f[1].Curr.Y=a[1].Y;var l={Value:this.m_UseFullRange};this.RangeTest(a[0],l);this.m_UseFullRange=l.Value;l.Value=this.m_UseFullRange;this.RangeTest(a[e],l);this.m_UseFullRange=l.Value;this.InitEdge(f[0],f[1],f[e],a[0]);this.InitEdge(f[e],f[0],f[e-1],a[e]);for(g=e-1;1<=g;--g)l.Value=this.m_UseFullRange,this.RangeTest(a[g],l),this.m_UseFullRange=l.Value,this.InitEdge(f[g],f[g+1],f[g-1],a[g]);for(g=a=e=f[0];;)if(a.Curr!=a.Next.Curr||!c&&a.Next==e){if(a.Prev==a.Next)break;else if(c&&d.ClipperBase.SlopesEqual(a.Prev.Curr,
a.Curr,a.Next.Curr,this.m_UseFullRange)&&(!this.PreserveCollinear||!this.Pt2IsBetweenPt1AndPt3(a.Prev.Curr,a.Curr,a.Next.Curr))){a==e&&(e=a.Next);a=this.RemoveEdge(a);g=a=a.Prev;continue}a=a.Next;if(a==g||!c&&a.Next==e)break}else{if(a==a.Next)break;a==e&&(e=a.Next);g=a=this.RemoveEdge(a)}if(!c&&a==a.Next||c&&a.Prev==a.Next)return!1;c||(this.m_HasOpenPaths=!0,e.Prev.OutIdx=d.ClipperBase.Skip);a=e;do this.InitEdge2(a,b),a=a.Next,h&&a.Curr.Y!=e.Curr.Y&&(h=!1);while(a!=e);if(h){if(c)return!1;a.Prev.OutIdx=
d.ClipperBase.Skip;a.Prev.Bot.X<a.Prev.Top.X&&this.ReverseHorizontal(a.Prev);b=new d.LocalMinima;b.Next=null;b.Y=a.Bot.Y;b.LeftBound=null;b.RightBound=a;b.RightBound.Side=d.EdgeSide.esRight;for(b.RightBound.WindDelta=0;a.Next.OutIdx!=d.ClipperBase.Skip;)a.NextInLML=a.Next,a.Bot.X!=a.Prev.Top.X&&this.ReverseHorizontal(a),a=a.Next;this.InsertLocalMinima(b);this.m_edges.push(f);return!0}this.m_edges.push(f);h=null;d.IntPoint.op_Equality(a.Prev.Bot,a.Prev.Top)&&(a=a.Next);for(;;){a=this.FindNextLocMin(a);
if(a==h)break;else null==h&&(h=a);b=new d.LocalMinima;b.Next=null;b.Y=a.Bot.Y;a.Dx<a.Prev.Dx?(b.LeftBound=a.Prev,b.RightBound=a,f=!1):(b.LeftBound=a,b.RightBound=a.Prev,f=!0);b.LeftBound.Side=d.EdgeSide.esLeft;b.RightBound.Side=d.EdgeSide.esRight;b.LeftBound.WindDelta=c?b.LeftBound.Next==b.RightBound?-1:1:0;b.RightBound.WindDelta=-b.LeftBound.WindDelta;a=this.ProcessBound(b.LeftBound,f);a.OutIdx==d.ClipperBase.Skip&&(a=this.ProcessBound(a,f));e=this.ProcessBound(b.RightBound,!f);e.OutIdx==d.ClipperBase.Skip&&
(e=this.ProcessBound(e,!f));b.LeftBound.OutIdx==d.ClipperBase.Skip?b.LeftBound=null:b.RightBound.OutIdx==d.ClipperBase.Skip&&(b.RightBound=null);this.InsertLocalMinima(b);f||(a=e)}return!0};d.ClipperBase.prototype.AddPaths=function(a,b,c){for(var e=!1,d=0,g=a.length;d<g;++d)this.AddPath(a[d],b,c)&&(e=!0);return e};d.ClipperBase.prototype.Pt2IsBetweenPt1AndPt3=function(a,b,c){return d.IntPoint.op_Equality(a,c)||d.IntPoint.op_Equality(a,b)||d.IntPoint.op_Equality(c,b)?!1:a.X!=c.X?b.X>a.X==b.X<c.X:b.Y>
a.Y==b.Y<c.Y};d.ClipperBase.prototype.RemoveEdge=function(a){a.Prev.Next=a.Next;a.Next.Prev=a.Prev;var b=a.Next;a.Prev=null;return b};d.ClipperBase.prototype.SetDx=function(a){a.Delta.X=a.Top.X-a.Bot.X;a.Delta.Y=a.Top.Y-a.Bot.Y;a.Dx=0===a.Delta.Y?d.ClipperBase.horizontal:a.Delta.X/a.Delta.Y};d.ClipperBase.prototype.InsertLocalMinima=function(a){if(null===this.m_MinimaList)this.m_MinimaList=a;else if(a.Y>=this.m_MinimaList.Y)a.Next=this.m_MinimaList,this.m_MinimaList=a;else{for(var b=this.m_MinimaList;null!==
b.Next&&a.Y<b.Next.Y;)b=b.Next;a.Next=b.Next;b.Next=a}};d.ClipperBase.prototype.PopLocalMinima=function(){null!==this.m_CurrentLM&&(this.m_CurrentLM=this.m_CurrentLM.Next)};d.ClipperBase.prototype.ReverseHorizontal=function(a){var b=a.Top.X;a.Top.X=a.Bot.X;a.Bot.X=b};d.ClipperBase.prototype.Reset=function(){this.m_CurrentLM=this.m_MinimaList;if(null!=this.m_CurrentLM)for(var a=this.m_MinimaList;null!=a;){var b=a.LeftBound;null!=b&&(b.Curr.X=b.Bot.X,b.Curr.Y=b.Bot.Y,b.Side=d.EdgeSide.esLeft,b.OutIdx=
d.ClipperBase.Unassigned);b=a.RightBound;null!=b&&(b.Curr.X=b.Bot.X,b.Curr.Y=b.Bot.Y,b.Side=d.EdgeSide.esRight,b.OutIdx=d.ClipperBase.Unassigned);a=a.Next}};d.Clipper=function(a){"undefined"==typeof a&&(a=0);this.m_PolyOuts=null;this.m_ClipType=d.ClipType.ctIntersection;this.m_IntersectNodeComparer=this.m_IntersectList=this.m_SortedEdges=this.m_ActiveEdges=this.m_Scanbeam=null;this.m_ExecuteLocked=!1;this.m_SubjFillType=this.m_ClipFillType=d.PolyFillType.pftEvenOdd;this.m_GhostJoins=this.m_Joins=
null;this.StrictlySimple=this.ReverseSolution=this.m_UsingPolyTree=!1;d.ClipperBase.call(this);this.m_SortedEdges=this.m_ActiveEdges=this.m_Scanbeam=null;this.m_IntersectList=[];this.m_IntersectNodeComparer=d.MyIntersectNodeSort.Compare;this.m_UsingPolyTree=this.m_ExecuteLocked=!1;this.m_PolyOuts=[];this.m_Joins=[];this.m_GhostJoins=[];this.ReverseSolution=0!==(1&a);this.StrictlySimple=0!==(2&a);this.PreserveCollinear=0!==(4&a)};d.Clipper.ioReverseSolution=1;d.Clipper.ioStrictlySimple=2;d.Clipper.ioPreserveCollinear=
4;d.Clipper.prototype.Clear=function(){0!==this.m_edges.length&&(this.DisposeAllPolyPts(),d.ClipperBase.prototype.Clear.call(this))};d.Clipper.prototype.DisposeScanbeamList=function(){for(;null!==this.m_Scanbeam;){var a=this.m_Scanbeam.Next;this.m_Scanbeam=null;this.m_Scanbeam=a}};d.Clipper.prototype.Reset=function(){d.ClipperBase.prototype.Reset.call(this);this.m_SortedEdges=this.m_ActiveEdges=this.m_Scanbeam=null;for(var a=this.m_MinimaList;null!==a;)this.InsertScanbeam(a.Y),a=a.Next};d.Clipper.prototype.InsertScanbeam=
function(a){if(null===this.m_Scanbeam)this.m_Scanbeam=new d.Scanbeam,this.m_Scanbeam.Next=null,this.m_Scanbeam.Y=a;else if(a>this.m_Scanbeam.Y){var b=new d.Scanbeam;b.Y=a;b.Next=this.m_Scanbeam;this.m_Scanbeam=b}else{for(var c=this.m_Scanbeam;null!==c.Next&&a<=c.Next.Y;)c=c.Next;a!=c.Y&&(b=new d.Scanbeam,b.Y=a,b.Next=c.Next,c.Next=b)}};d.Clipper.prototype.Execute=function(){var a=arguments,b=a.length,c=a[1]instanceof d.PolyTree;if(4!=b||c){if(4==b&&c){var b=a[0],e=a[1],c=a[2],a=a[3];if(this.m_ExecuteLocked)return!1;
this.m_ExecuteLocked=!0;this.m_SubjFillType=c;this.m_ClipFillType=a;this.m_ClipType=b;this.m_UsingPolyTree=!0;try{(f=this.ExecuteInternal())&&this.BuildResult2(e)}finally{this.DisposeAllPolyPts(),this.m_ExecuteLocked=!1}return f}if(2==b&&!c||2==b&&c)return b=a[0],e=a[1],this.Execute(b,e,d.PolyFillType.pftEvenOdd,d.PolyFillType.pftEvenOdd)}else{b=a[0];e=a[1];c=a[2];a=a[3];if(this.m_ExecuteLocked)return!1;this.m_HasOpenPaths&&d.Error("Error: PolyTree struct is need for open path clipping.");this.m_ExecuteLocked=
!0;d.Clear(e);this.m_SubjFillType=c;this.m_ClipFillType=a;this.m_ClipType=b;this.m_UsingPolyTree=!1;try{var f=this.ExecuteInternal();f&&this.BuildResult(e)}finally{this.DisposeAllPolyPts(),this.m_ExecuteLocked=!1}return f}};d.Clipper.prototype.FixHoleLinkage=function(a){if(null!==a.FirstLeft&&(a.IsHole==a.FirstLeft.IsHole||null===a.FirstLeft.Pts)){for(var b=a.FirstLeft;null!==b&&(b.IsHole==a.IsHole||null===b.Pts);)b=b.FirstLeft;a.FirstLeft=b}};d.Clipper.prototype.ExecuteInternal=function(){try{this.Reset();
if(null===this.m_CurrentLM)return!1;var a=this.PopScanbeam();do{this.InsertLocalMinimaIntoAEL(a);d.Clear(this.m_GhostJoins);this.ProcessHorizontals(!1);if(null===this.m_Scanbeam)break;var b=this.PopScanbeam();if(!this.ProcessIntersections(b))return!1;this.ProcessEdgesAtTopOfScanbeam(b);a=b}while(null!==this.m_Scanbeam||null!==this.m_CurrentLM);for(var a=0,c=this.m_PolyOuts.length;a<c;a++){var e=this.m_PolyOuts[a];null===e.Pts||e.IsOpen||(e.IsHole^this.ReverseSolution)==0<this.Area(e)&&this.ReversePolyPtLinks(e.Pts)}this.JoinCommonEdges();
a=0;for(c=this.m_PolyOuts.length;a<c;a++)e=this.m_PolyOuts[a],null===e.Pts||e.IsOpen||this.FixupOutPolygon(e);this.StrictlySimple&&this.DoSimplePolygons();return!0}finally{d.Clear(this.m_Joins),d.Clear(this.m_GhostJoins)}};d.Clipper.prototype.PopScanbeam=function(){var a=this.m_Scanbeam.Y;this.m_Scanbeam=this.m_Scanbeam.Next;return a};d.Clipper.prototype.DisposeAllPolyPts=function(){for(var a=0,b=this.m_PolyOuts.length;a<b;++a)this.DisposeOutRec(a);d.Clear(this.m_PolyOuts)};d.Clipper.prototype.DisposeOutRec=
function(a){this.m_PolyOuts[a].Pts=null;this.m_PolyOuts[a]=null};d.Clipper.prototype.AddJoin=function(a,b,c){var e=new d.Join;e.OutPt1=a;e.OutPt2=b;e.OffPt.X=c.X;e.OffPt.Y=c.Y;this.m_Joins.push(e)};d.Clipper.prototype.AddGhostJoin=function(a,b){var c=new d.Join;c.OutPt1=a;c.OffPt.X=b.X;c.OffPt.Y=b.Y;this.m_GhostJoins.push(c)};d.Clipper.prototype.InsertLocalMinimaIntoAEL=function(a){for(;null!==this.m_CurrentLM&&this.m_CurrentLM.Y==a;){var b=this.m_CurrentLM.LeftBound,c=this.m_CurrentLM.RightBound;
this.PopLocalMinima();var e=null;null===b?(this.InsertEdgeIntoAEL(c,null),this.SetWindingCount(c),this.IsContributing(c)&&(e=this.AddOutPt(c,c.Bot))):(null==c?(this.InsertEdgeIntoAEL(b,null),this.SetWindingCount(b),this.IsContributing(b)&&(e=this.AddOutPt(b,b.Bot))):(this.InsertEdgeIntoAEL(b,null),this.InsertEdgeIntoAEL(c,b),this.SetWindingCount(b),c.WindCnt=b.WindCnt,c.WindCnt2=b.WindCnt2,this.IsContributing(b)&&(e=this.AddLocalMinPoly(b,c,b.Bot))),this.InsertScanbeam(b.Top.Y));null!=c&&(d.ClipperBase.IsHorizontal(c)?
this.AddEdgeToSEL(c):this.InsertScanbeam(c.Top.Y));if(null!=b&&null!=c){if(null!==e&&d.ClipperBase.IsHorizontal(c)&&0<this.m_GhostJoins.length&&0!==c.WindDelta)for(var f=0,g=this.m_GhostJoins.length;f<g;f++){var h=this.m_GhostJoins[f];this.HorzSegmentsOverlap(h.OutPt1.Pt.X,h.OffPt.X,c.Bot.X,c.Top.X)&&this.AddJoin(h.OutPt1,e,h.OffPt)}0<=b.OutIdx&&null!==b.PrevInAEL&&b.PrevInAEL.Curr.X==b.Bot.X&&0<=b.PrevInAEL.OutIdx&&d.ClipperBase.SlopesEqual(b.PrevInAEL,b,this.m_UseFullRange)&&0!==b.WindDelta&&0!==
b.PrevInAEL.WindDelta&&(f=this.AddOutPt(b.PrevInAEL,b.Bot),this.AddJoin(e,f,b.Top));if(b.NextInAEL!=c&&(0<=c.OutIdx&&0<=c.PrevInAEL.OutIdx&&d.ClipperBase.SlopesEqual(c.PrevInAEL,c,this.m_UseFullRange)&&0!==c.WindDelta&&0!==c.PrevInAEL.WindDelta&&(f=this.AddOutPt(c.PrevInAEL,c.Bot),this.AddJoin(e,f,c.Top)),e=b.NextInAEL,null!==e))for(;e!=c;)this.IntersectEdges(c,e,b.Curr,!1),e=e.NextInAEL}}};d.Clipper.prototype.InsertEdgeIntoAEL=function(a,b){if(null===this.m_ActiveEdges)a.PrevInAEL=null,a.NextInAEL=
null,this.m_ActiveEdges=a;else if(null===b&&this.E2InsertsBeforeE1(this.m_ActiveEdges,a))a.PrevInAEL=null,a.NextInAEL=this.m_ActiveEdges,this.m_ActiveEdges=this.m_ActiveEdges.PrevInAEL=a;else{null===b&&(b=this.m_ActiveEdges);for(;null!==b.NextInAEL&&!this.E2InsertsBeforeE1(b.NextInAEL,a);)b=b.NextInAEL;a.NextInAEL=b.NextInAEL;null!==b.NextInAEL&&(b.NextInAEL.PrevInAEL=a);a.PrevInAEL=b;b.NextInAEL=a}};d.Clipper.prototype.E2InsertsBeforeE1=function(a,b){return b.Curr.X==a.Curr.X?b.Top.Y>a.Top.Y?b.Top.X<
d.Clipper.TopX(a,b.Top.Y):a.Top.X>d.Clipper.TopX(b,a.Top.Y):b.Curr.X<a.Curr.X};d.Clipper.prototype.IsEvenOddFillType=function(a){return a.PolyTyp==d.PolyType.ptSubject?this.m_SubjFillType==d.PolyFillType.pftEvenOdd:this.m_ClipFillType==d.PolyFillType.pftEvenOdd};d.Clipper.prototype.IsEvenOddAltFillType=function(a){return a.PolyTyp==d.PolyType.ptSubject?this.m_ClipFillType==d.PolyFillType.pftEvenOdd:this.m_SubjFillType==d.PolyFillType.pftEvenOdd};d.Clipper.prototype.IsContributing=function(a){var b,
c;a.PolyTyp==d.PolyType.ptSubject?(b=this.m_SubjFillType,c=this.m_ClipFillType):(b=this.m_ClipFillType,c=this.m_SubjFillType);switch(b){case d.PolyFillType.pftEvenOdd:if(0===a.WindDelta&&1!=a.WindCnt)return!1;break;case d.PolyFillType.pftNonZero:if(1!=Math.abs(a.WindCnt))return!1;break;case d.PolyFillType.pftPositive:if(1!=a.WindCnt)return!1;break;default:if(-1!=a.WindCnt)return!1}switch(this.m_ClipType){case d.ClipType.ctIntersection:switch(c){case d.PolyFillType.pftEvenOdd:case d.PolyFillType.pftNonZero:return 0!==
a.WindCnt2;case d.PolyFillType.pftPositive:return 0<a.WindCnt2;default:return 0>a.WindCnt2}case d.ClipType.ctUnion:switch(c){case d.PolyFillType.pftEvenOdd:case d.PolyFillType.pftNonZero:return 0===a.WindCnt2;case d.PolyFillType.pftPositive:return 0>=a.WindCnt2;default:return 0<=a.WindCnt2}case d.ClipType.ctDifference:if(a.PolyTyp==d.PolyType.ptSubject)switch(c){case d.PolyFillType.pftEvenOdd:case d.PolyFillType.pftNonZero:return 0===a.WindCnt2;case d.PolyFillType.pftPositive:return 0>=a.WindCnt2;
default:return 0<=a.WindCnt2}else switch(c){case d.PolyFillType.pftEvenOdd:case d.PolyFillType.pftNonZero:return 0!==a.WindCnt2;case d.PolyFillType.pftPositive:return 0<a.WindCnt2;default:return 0>a.WindCnt2}case d.ClipType.ctXor:if(0===a.WindDelta)switch(c){case d.PolyFillType.pftEvenOdd:case d.PolyFillType.pftNonZero:return 0===a.WindCnt2;case d.PolyFillType.pftPositive:return 0>=a.WindCnt2;default:return 0<=a.WindCnt2}}return!0};d.Clipper.prototype.SetWindingCount=function(a){for(var b=a.PrevInAEL;null!==
b&&(b.PolyTyp!=a.PolyTyp||0===b.WindDelta);)b=b.PrevInAEL;if(null===b)a.WindCnt=0===a.WindDelta?1:a.WindDelta,a.WindCnt2=0,b=this.m_ActiveEdges;else{if(0===a.WindDelta&&this.m_ClipType!=d.ClipType.ctUnion)a.WindCnt=1;else if(this.IsEvenOddFillType(a))if(0===a.WindDelta){for(var c=!0,e=b.PrevInAEL;null!==e;)e.PolyTyp==b.PolyTyp&&0!==e.WindDelta&&(c=!c),e=e.PrevInAEL;a.WindCnt=c?0:1}else a.WindCnt=a.WindDelta;else a.WindCnt=0>b.WindCnt*b.WindDelta?1<Math.abs(b.WindCnt)?0>b.WindDelta*a.WindDelta?b.WindCnt:
b.WindCnt+a.WindDelta:0===a.WindDelta?1:a.WindDelta:0===a.WindDelta?0>b.WindCnt?b.WindCnt-1:b.WindCnt+1:0>b.WindDelta*a.WindDelta?b.WindCnt:b.WindCnt+a.WindDelta;a.WindCnt2=b.WindCnt2;b=b.NextInAEL}if(this.IsEvenOddAltFillType(a))for(;b!=a;)0!==b.WindDelta&&(a.WindCnt2=0===a.WindCnt2?1:0),b=b.NextInAEL;else for(;b!=a;)a.WindCnt2+=b.WindDelta,b=b.NextInAEL};d.Clipper.prototype.AddEdgeToSEL=function(a){null===this.m_SortedEdges?(this.m_SortedEdges=a,a.PrevInSEL=null,a.NextInSEL=null):(a.NextInSEL=this.m_SortedEdges,
a.PrevInSEL=null,this.m_SortedEdges=this.m_SortedEdges.PrevInSEL=a)};d.Clipper.prototype.CopyAELToSEL=function(){var a=this.m_ActiveEdges;for(this.m_SortedEdges=a;null!==a;)a.PrevInSEL=a.PrevInAEL,a=a.NextInSEL=a.NextInAEL};d.Clipper.prototype.SwapPositionsInAEL=function(a,b){if(a.NextInAEL!=a.PrevInAEL&&b.NextInAEL!=b.PrevInAEL){if(a.NextInAEL==b){var c=b.NextInAEL;null!==c&&(c.PrevInAEL=a);var e=a.PrevInAEL;null!==e&&(e.NextInAEL=b);b.PrevInAEL=e;b.NextInAEL=a;a.PrevInAEL=b;a.NextInAEL=c}else b.NextInAEL==
a?(c=a.NextInAEL,null!==c&&(c.PrevInAEL=b),e=b.PrevInAEL,null!==e&&(e.NextInAEL=a),a.PrevInAEL=e,a.NextInAEL=b,b.PrevInAEL=a,b.NextInAEL=c):(c=a.NextInAEL,e=a.PrevInAEL,a.NextInAEL=b.NextInAEL,null!==a.NextInAEL&&(a.NextInAEL.PrevInAEL=a),a.PrevInAEL=b.PrevInAEL,null!==a.PrevInAEL&&(a.PrevInAEL.NextInAEL=a),b.NextInAEL=c,null!==b.NextInAEL&&(b.NextInAEL.PrevInAEL=b),b.PrevInAEL=e,null!==b.PrevInAEL&&(b.PrevInAEL.NextInAEL=b));null===a.PrevInAEL?this.m_ActiveEdges=a:null===b.PrevInAEL&&(this.m_ActiveEdges=
b)}};d.Clipper.prototype.SwapPositionsInSEL=function(a,b){if(null!==a.NextInSEL||null!==a.PrevInSEL)if(null!==b.NextInSEL||null!==b.PrevInSEL){if(a.NextInSEL==b){var c=b.NextInSEL;null!==c&&(c.PrevInSEL=a);var e=a.PrevInSEL;null!==e&&(e.NextInSEL=b);b.PrevInSEL=e;b.NextInSEL=a;a.PrevInSEL=b;a.NextInSEL=c}else b.NextInSEL==a?(c=a.NextInSEL,null!==c&&(c.PrevInSEL=b),e=b.PrevInSEL,null!==e&&(e.NextInSEL=a),a.PrevInSEL=e,a.NextInSEL=b,b.PrevInSEL=a,b.NextInSEL=c):(c=a.NextInSEL,e=a.PrevInSEL,a.NextInSEL=
b.NextInSEL,null!==a.NextInSEL&&(a.NextInSEL.PrevInSEL=a),a.PrevInSEL=b.PrevInSEL,null!==a.PrevInSEL&&(a.PrevInSEL.NextInSEL=a),b.NextInSEL=c,null!==b.NextInSEL&&(b.NextInSEL.PrevInSEL=b),b.PrevInSEL=e,null!==b.PrevInSEL&&(b.PrevInSEL.NextInSEL=b));null===a.PrevInSEL?this.m_SortedEdges=a:null===b.PrevInSEL&&(this.m_SortedEdges=b)}};d.Clipper.prototype.AddLocalMaxPoly=function(a,b,c){this.AddOutPt(a,c);0==b.WindDelta&&this.AddOutPt(b,c);a.OutIdx==b.OutIdx?(a.OutIdx=-1,b.OutIdx=-1):a.OutIdx<b.OutIdx?
this.AppendPolygon(a,b):this.AppendPolygon(b,a)};d.Clipper.prototype.AddLocalMinPoly=function(a,b,c){var e,f;d.ClipperBase.IsHorizontal(b)||a.Dx>b.Dx?(e=this.AddOutPt(a,c),b.OutIdx=a.OutIdx,a.Side=d.EdgeSide.esLeft,b.Side=d.EdgeSide.esRight,f=a,a=f.PrevInAEL==b?b.PrevInAEL:f.PrevInAEL):(e=this.AddOutPt(b,c),a.OutIdx=b.OutIdx,a.Side=d.EdgeSide.esRight,b.Side=d.EdgeSide.esLeft,f=b,a=f.PrevInAEL==a?a.PrevInAEL:f.PrevInAEL);null!==a&&0<=a.OutIdx&&d.Clipper.TopX(a,c.Y)==d.Clipper.TopX(f,c.Y)&&d.ClipperBase.SlopesEqual(f,
a,this.m_UseFullRange)&&0!==f.WindDelta&&0!==a.WindDelta&&(c=this.AddOutPt(a,c),this.AddJoin(e,c,f.Top));return e};d.Clipper.prototype.CreateOutRec=function(){var a=new d.OutRec;a.Idx=-1;a.IsHole=!1;a.IsOpen=!1;a.FirstLeft=null;a.Pts=null;a.BottomPt=null;a.PolyNode=null;this.m_PolyOuts.push(a);a.Idx=this.m_PolyOuts.length-1;return a};d.Clipper.prototype.AddOutPt=function(a,b){var c=a.Side==d.EdgeSide.esLeft;if(0>a.OutIdx){var e=this.CreateOutRec();e.IsOpen=0===a.WindDelta;var f=new d.OutPt;e.Pts=
f;f.Idx=e.Idx;f.Pt.X=b.X;f.Pt.Y=b.Y;f.Next=f;f.Prev=f;e.IsOpen||this.SetHoleState(a,e);a.OutIdx=e.Idx}else{var e=this.m_PolyOuts[a.OutIdx],g=e.Pts;if(c&&d.IntPoint.op_Equality(b,g.Pt))return g;if(!c&&d.IntPoint.op_Equality(b,g.Prev.Pt))return g.Prev;f=new d.OutPt;f.Idx=e.Idx;f.Pt.X=b.X;f.Pt.Y=b.Y;f.Next=g;f.Prev=g.Prev;f.Prev.Next=f;g.Prev=f;c&&(e.Pts=f)}return f};d.Clipper.prototype.SwapPoints=function(a,b){var c=new d.IntPoint(a.Value);a.Value.X=b.Value.X;a.Value.Y=b.Value.Y;b.Value.X=c.X;b.Value.Y=
c.Y};d.Clipper.prototype.HorzSegmentsOverlap=function(a,b,c,e){var d;a>b&&(d=a,a=b,b=d);c>e&&(d=c,c=e,e=d);return a<e&&c<b};d.Clipper.prototype.SetHoleState=function(a,b){for(var c=!1,e=a.PrevInAEL;null!==e;)0<=e.OutIdx&&0!=e.WindDelta&&(c=!c,null===b.FirstLeft&&(b.FirstLeft=this.m_PolyOuts[e.OutIdx])),e=e.PrevInAEL;c&&(b.IsHole=!0)};d.Clipper.prototype.GetDx=function(a,b){return a.Y==b.Y?d.ClipperBase.horizontal:(b.X-a.X)/(b.Y-a.Y)};d.Clipper.prototype.FirstIsBottomPt=function(a,b){for(var c=a.Prev;d.IntPoint.op_Equality(c.Pt,
a.Pt)&&c!=a;)c=c.Prev;for(var e=Math.abs(this.GetDx(a.Pt,c.Pt)),c=a.Next;d.IntPoint.op_Equality(c.Pt,a.Pt)&&c!=a;)c=c.Next;for(var f=Math.abs(this.GetDx(a.Pt,c.Pt)),c=b.Prev;d.IntPoint.op_Equality(c.Pt,b.Pt)&&c!=b;)c=c.Prev;for(var g=Math.abs(this.GetDx(b.Pt,c.Pt)),c=b.Next;d.IntPoint.op_Equality(c.Pt,b.Pt)&&c!=b;)c=c.Next;c=Math.abs(this.GetDx(b.Pt,c.Pt));return e>=g&&e>=c||f>=g&&f>=c};d.Clipper.prototype.GetBottomPt=function(a){for(var b=null,c=a.Next;c!=a;)c.Pt.Y>a.Pt.Y?(a=c,b=null):c.Pt.Y==a.Pt.Y&&
c.Pt.X<=a.Pt.X&&(c.Pt.X<a.Pt.X?(b=null,a=c):c.Next!=a&&c.Prev!=a&&(b=c)),c=c.Next;if(null!==b)for(;b!=c;)for(this.FirstIsBottomPt(c,b)||(a=b),b=b.Next;d.IntPoint.op_Inequality(b.Pt,a.Pt);)b=b.Next;return a};d.Clipper.prototype.GetLowermostRec=function(a,b){null===a.BottomPt&&(a.BottomPt=this.GetBottomPt(a.Pts));null===b.BottomPt&&(b.BottomPt=this.GetBottomPt(b.Pts));var c=a.BottomPt,e=b.BottomPt;return c.Pt.Y>e.Pt.Y?a:c.Pt.Y<e.Pt.Y?b:c.Pt.X<e.Pt.X?a:c.Pt.X>e.Pt.X?b:c.Next==c?b:e.Next==e?a:this.FirstIsBottomPt(c,
e)?a:b};d.Clipper.prototype.Param1RightOfParam2=function(a,b){do if(a=a.FirstLeft,a==b)return!0;while(null!==a);return!1};d.Clipper.prototype.GetOutRec=function(a){for(a=this.m_PolyOuts[a];a!=this.m_PolyOuts[a.Idx];)a=this.m_PolyOuts[a.Idx];return a};d.Clipper.prototype.AppendPolygon=function(a,b){var c=this.m_PolyOuts[a.OutIdx],e=this.m_PolyOuts[b.OutIdx],f;f=this.Param1RightOfParam2(c,e)?e:this.Param1RightOfParam2(e,c)?c:this.GetLowermostRec(c,e);var g=c.Pts,h=g.Prev,l=e.Pts,k=l.Prev;a.Side==d.EdgeSide.esLeft?
(b.Side==d.EdgeSide.esLeft?(this.ReversePolyPtLinks(l),l.Next=g,g.Prev=l,h.Next=k,k.Prev=h,c.Pts=k):(k.Next=g,g.Prev=k,l.Prev=h,h.Next=l,c.Pts=l),g=d.EdgeSide.esLeft):(b.Side==d.EdgeSide.esRight?(this.ReversePolyPtLinks(l),h.Next=k,k.Prev=h,l.Next=g,g.Prev=l):(h.Next=l,l.Prev=h,g.Prev=k,k.Next=g),g=d.EdgeSide.esRight);c.BottomPt=null;f==e&&(e.FirstLeft!=c&&(c.FirstLeft=e.FirstLeft),c.IsHole=e.IsHole);e.Pts=null;e.BottomPt=null;e.FirstLeft=c;f=a.OutIdx;h=b.OutIdx;a.OutIdx=-1;b.OutIdx=-1;for(l=this.m_ActiveEdges;null!==
l;){if(l.OutIdx==h){l.OutIdx=f;l.Side=g;break}l=l.NextInAEL}e.Idx=c.Idx};d.Clipper.prototype.ReversePolyPtLinks=function(a){if(null!==a){var b,c;b=a;do c=b.Next,b.Next=b.Prev,b=b.Prev=c;while(b!=a)}};d.Clipper.SwapSides=function(a,b){var c=a.Side;a.Side=b.Side;b.Side=c};d.Clipper.SwapPolyIndexes=function(a,b){var c=a.OutIdx;a.OutIdx=b.OutIdx;b.OutIdx=c};d.Clipper.prototype.IntersectEdges=function(a,b,c){var e=0<=a.OutIdx,f=0<=b.OutIdx;if(0===a.WindDelta||0===b.WindDelta){if(0!=a.WindDelta||0!=b.WindDelta)a.PolyTyp==
b.PolyTyp&&a.WindDelta!=b.WindDelta&&this.m_ClipType==d.ClipType.ctUnion?0===a.WindDelta?f&&(this.AddOutPt(a,c),e&&(a.OutIdx=-1)):e&&(this.AddOutPt(b,c),f&&(b.OutIdx=-1)):a.PolyTyp!=b.PolyTyp&&(0!==a.WindDelta||1!=Math.abs(b.WindCnt)||this.m_ClipType==d.ClipType.ctUnion&&0!==b.WindCnt2?0!==b.WindDelta||1!=Math.abs(a.WindCnt)||this.m_ClipType==d.ClipType.ctUnion&&0!==a.WindCnt2||(this.AddOutPt(b,c),f&&(b.OutIdx=-1)):(this.AddOutPt(a,c),e&&(a.OutIdx=-1)))}else{if(a.PolyTyp==b.PolyTyp)if(this.IsEvenOddFillType(a)){var g=
a.WindCnt;a.WindCnt=b.WindCnt;b.WindCnt=g}else a.WindCnt=0===a.WindCnt+b.WindDelta?-a.WindCnt:a.WindCnt+b.WindDelta,b.WindCnt=0===b.WindCnt-a.WindDelta?-b.WindCnt:b.WindCnt-a.WindDelta;else this.IsEvenOddFillType(b)?a.WindCnt2=0===a.WindCnt2?1:0:a.WindCnt2+=b.WindDelta,this.IsEvenOddFillType(a)?b.WindCnt2=0===b.WindCnt2?1:0:b.WindCnt2-=a.WindDelta;var h,l,k;a.PolyTyp==d.PolyType.ptSubject?(h=this.m_SubjFillType,k=this.m_ClipFillType):(h=this.m_ClipFillType,k=this.m_SubjFillType);b.PolyTyp==d.PolyType.ptSubject?
(l=this.m_SubjFillType,g=this.m_ClipFillType):(l=this.m_ClipFillType,g=this.m_SubjFillType);switch(h){case d.PolyFillType.pftPositive:h=a.WindCnt;break;case d.PolyFillType.pftNegative:h=-a.WindCnt;break;default:h=Math.abs(a.WindCnt)}switch(l){case d.PolyFillType.pftPositive:l=b.WindCnt;break;case d.PolyFillType.pftNegative:l=-b.WindCnt;break;default:l=Math.abs(b.WindCnt)}if(e&&f)0!=h&&1!=h||0!=l&&1!=l||a.PolyTyp!=b.PolyTyp&&this.m_ClipType!=d.ClipType.ctXor?this.AddLocalMaxPoly(a,b,c):(this.AddOutPt(a,
c),this.AddOutPt(b,c),d.Clipper.SwapSides(a,b),d.Clipper.SwapPolyIndexes(a,b));else if(e){if(0===l||1==l)this.AddOutPt(a,c),d.Clipper.SwapSides(a,b),d.Clipper.SwapPolyIndexes(a,b)}else if(f){if(0===h||1==h)this.AddOutPt(b,c),d.Clipper.SwapSides(a,b),d.Clipper.SwapPolyIndexes(a,b)}else if(!(0!=h&&1!=h||0!=l&&1!=l)){switch(k){case d.PolyFillType.pftPositive:e=a.WindCnt2;break;case d.PolyFillType.pftNegative:e=-a.WindCnt2;break;default:e=Math.abs(a.WindCnt2)}switch(g){case d.PolyFillType.pftPositive:f=
b.WindCnt2;break;case d.PolyFillType.pftNegative:f=-b.WindCnt2;break;default:f=Math.abs(b.WindCnt2)}if(a.PolyTyp!=b.PolyTyp)this.AddLocalMinPoly(a,b,c);else if(1==h&&1==l)switch(this.m_ClipType){case d.ClipType.ctIntersection:0<e&&0<f&&this.AddLocalMinPoly(a,b,c);break;case d.ClipType.ctUnion:0>=e&&0>=f&&this.AddLocalMinPoly(a,b,c);break;case d.ClipType.ctDifference:(a.PolyTyp==d.PolyType.ptClip&&0<e&&0<f||a.PolyTyp==d.PolyType.ptSubject&&0>=e&&0>=f)&&this.AddLocalMinPoly(a,b,c);break;case d.ClipType.ctXor:this.AddLocalMinPoly(a,
b,c)}else d.Clipper.SwapSides(a,b)}}};d.Clipper.prototype.DeleteFromAEL=function(a){var b=a.PrevInAEL,c=a.NextInAEL;if(null!==b||null!==c||a==this.m_ActiveEdges)null!==b?b.NextInAEL=c:this.m_ActiveEdges=c,null!==c&&(c.PrevInAEL=b),a.NextInAEL=null,a.PrevInAEL=null};d.Clipper.prototype.DeleteFromSEL=function(a){var b=a.PrevInSEL,c=a.NextInSEL;if(null!==b||null!==c||a==this.m_SortedEdges)null!==b?b.NextInSEL=c:this.m_SortedEdges=c,null!==c&&(c.PrevInSEL=b),a.NextInSEL=null,a.PrevInSEL=null};d.Clipper.prototype.UpdateEdgeIntoAEL=
function(a){null===a.NextInLML&&d.Error("UpdateEdgeIntoAEL: invalid call");var b=a.PrevInAEL,c=a.NextInAEL;a.NextInLML.OutIdx=a.OutIdx;null!==b?b.NextInAEL=a.NextInLML:this.m_ActiveEdges=a.NextInLML;null!==c&&(c.PrevInAEL=a.NextInLML);a.NextInLML.Side=a.Side;a.NextInLML.WindDelta=a.WindDelta;a.NextInLML.WindCnt=a.WindCnt;a.NextInLML.WindCnt2=a.WindCnt2;a=a.NextInLML;a.Curr.X=a.Bot.X;a.Curr.Y=a.Bot.Y;a.PrevInAEL=b;a.NextInAEL=c;d.ClipperBase.IsHorizontal(a)||this.InsertScanbeam(a.Top.Y);return a};
d.Clipper.prototype.ProcessHorizontals=function(a){for(var b=this.m_SortedEdges;null!==b;)this.DeleteFromSEL(b),this.ProcessHorizontal(b,a),b=this.m_SortedEdges};d.Clipper.prototype.GetHorzDirection=function(a,b){a.Bot.X<a.Top.X?(b.Left=a.Bot.X,b.Right=a.Top.X,b.Dir=d.Direction.dLeftToRight):(b.Left=a.Top.X,b.Right=a.Bot.X,b.Dir=d.Direction.dRightToLeft)};d.Clipper.prototype.ProcessHorizontal=function(a,b){var c={Dir:null,Left:null,Right:null};this.GetHorzDirection(a,c);for(var e=c.Dir,f=c.Left,g=
c.Right,h=a,l=null;null!==h.NextInLML&&d.ClipperBase.IsHorizontal(h.NextInLML);)h=h.NextInLML;for(null===h.NextInLML&&(l=this.GetMaximaPair(h));;){for(var k=a==h,n=this.GetNextInAEL(a,e);null!==n&&!(n.Curr.X==a.Top.X&&null!==a.NextInLML&&n.Dx<a.NextInLML.Dx);){c=this.GetNextInAEL(n,e);if(e==d.Direction.dLeftToRight&&n.Curr.X<=g||e==d.Direction.dRightToLeft&&n.Curr.X>=f){if(n==l&&k){if(0<=a.OutIdx){e=this.AddOutPt(a,a.Top);for(c=this.m_SortedEdges;null!==c;)0<=c.OutIdx&&this.HorzSegmentsOverlap(a.Bot.X,
a.Top.X,c.Bot.X,c.Top.X)&&(f=this.AddOutPt(c,c.Bot),this.AddJoin(f,e,c.Top)),c=c.NextInSEL;this.AddGhostJoin(e,a.Bot);this.AddLocalMaxPoly(a,l,a.Top)}this.DeleteFromAEL(a);this.DeleteFromAEL(l);return}if(e==d.Direction.dLeftToRight){var p=new d.IntPoint(n.Curr.X,a.Curr.Y);this.IntersectEdges(a,n,p)}else p=new d.IntPoint(n.Curr.X,a.Curr.Y),this.IntersectEdges(n,a,p);this.SwapPositionsInAEL(a,n)}else if(e==d.Direction.dLeftToRight&&n.Curr.X>=g||e==d.Direction.dRightToLeft&&n.Curr.X<=f)break;n=c}if(null!==
a.NextInLML&&d.ClipperBase.IsHorizontal(a.NextInLML))a=this.UpdateEdgeIntoAEL(a),0<=a.OutIdx&&this.AddOutPt(a,a.Bot),c={Dir:e,Left:f,Right:g},this.GetHorzDirection(a,c),e=c.Dir,f=c.Left,g=c.Right;else break}null!==a.NextInLML?0<=a.OutIdx?(e=this.AddOutPt(a,a.Top),b&&this.AddGhostJoin(e,a.Bot),a=this.UpdateEdgeIntoAEL(a),0!==a.WindDelta&&(l=a.PrevInAEL,c=a.NextInAEL,null!==l&&l.Curr.X==a.Bot.X&&l.Curr.Y==a.Bot.Y&&0!==l.WindDelta&&0<=l.OutIdx&&l.Curr.Y>l.Top.Y&&d.ClipperBase.SlopesEqual(a,l,this.m_UseFullRange)?
(f=this.AddOutPt(l,a.Bot),this.AddJoin(e,f,a.Top)):null!==c&&c.Curr.X==a.Bot.X&&c.Curr.Y==a.Bot.Y&&0!==c.WindDelta&&0<=c.OutIdx&&c.Curr.Y>c.Top.Y&&d.ClipperBase.SlopesEqual(a,c,this.m_UseFullRange)&&(f=this.AddOutPt(c,a.Bot),this.AddJoin(e,f,a.Top)))):this.UpdateEdgeIntoAEL(a):(0<=a.OutIdx&&this.AddOutPt(a,a.Top),this.DeleteFromAEL(a))};d.Clipper.prototype.GetNextInAEL=function(a,b){return b==d.Direction.dLeftToRight?a.NextInAEL:a.PrevInAEL};d.Clipper.prototype.IsMinima=function(a){return null!==
a&&a.Prev.NextInLML!=a&&a.Next.NextInLML!=a};d.Clipper.prototype.IsMaxima=function(a,b){return null!==a&&a.Top.Y==b&&null===a.NextInLML};d.Clipper.prototype.IsIntermediate=function(a,b){return a.Top.Y==b&&null!==a.NextInLML};d.Clipper.prototype.GetMaximaPair=function(a){var b=null;d.IntPoint.op_Equality(a.Next.Top,a.Top)&&null===a.Next.NextInLML?b=a.Next:d.IntPoint.op_Equality(a.Prev.Top,a.Top)&&null===a.Prev.NextInLML&&(b=a.Prev);return null===b||-2!=b.OutIdx&&(b.NextInAEL!=b.PrevInAEL||d.ClipperBase.IsHorizontal(b))?
b:null};d.Clipper.prototype.ProcessIntersections=function(a){if(null==this.m_ActiveEdges)return!0;try{this.BuildIntersectList(a);if(0==this.m_IntersectList.length)return!0;if(1==this.m_IntersectList.length||this.FixupIntersectionOrder())this.ProcessIntersectList();else return!1}catch(b){this.m_SortedEdges=null,this.m_IntersectList.length=0,d.Error("ProcessIntersections error")}this.m_SortedEdges=null;return!0};d.Clipper.prototype.BuildIntersectList=function(a){if(null!==this.m_ActiveEdges){var b=
this.m_ActiveEdges;for(this.m_SortedEdges=b;null!==b;)b.PrevInSEL=b.PrevInAEL,b.NextInSEL=b.NextInAEL,b.Curr.X=d.Clipper.TopX(b,a),b=b.NextInAEL;for(var c=!0;c&&null!==this.m_SortedEdges;){c=!1;for(b=this.m_SortedEdges;null!==b.NextInSEL;){a=b.NextInSEL;var e=new d.IntPoint;b.Curr.X>a.Curr.X?(this.IntersectPoint(b,a,e),c=new d.IntersectNode,c.Edge1=b,c.Edge2=a,c.Pt.X=e.X,c.Pt.Y=e.Y,this.m_IntersectList.push(c),this.SwapPositionsInSEL(b,a),c=!0):b=a}if(null!==b.PrevInSEL)b.PrevInSEL.NextInSEL=null;
else break}this.m_SortedEdges=null}};d.Clipper.prototype.EdgesAdjacent=function(a){return a.Edge1.NextInSEL==a.Edge2||a.Edge1.PrevInSEL==a.Edge2};d.Clipper.IntersectNodeSort=function(a,b){return b.Pt.Y-a.Pt.Y};d.Clipper.prototype.FixupIntersectionOrder=function(){this.m_IntersectList.sort(this.m_IntersectNodeComparer);this.CopyAELToSEL();for(var a=this.m_IntersectList.length,b=0;b<a;b++){if(!this.EdgesAdjacent(this.m_IntersectList[b])){for(var c=b+1;c<a&&!this.EdgesAdjacent(this.m_IntersectList[c]);)c++;
if(c==a)return!1;var e=this.m_IntersectList[b];this.m_IntersectList[b]=this.m_IntersectList[c];this.m_IntersectList[c]=e}this.SwapPositionsInSEL(this.m_IntersectList[b].Edge1,this.m_IntersectList[b].Edge2)}return!0};d.Clipper.prototype.ProcessIntersectList=function(){for(var a=0,b=this.m_IntersectList.length;a<b;a++){var c=this.m_IntersectList[a];this.IntersectEdges(c.Edge1,c.Edge2,c.Pt);this.SwapPositionsInAEL(c.Edge1,c.Edge2)}this.m_IntersectList.length=0};G=function(a){return 0>a?Math.ceil(a-.5):
Math.round(a)};H=function(a){return 0>a?Math.ceil(a-.5):Math.floor(a+.5)};I=function(a){return 0>a?-Math.round(Math.abs(a)):Math.round(a)};J=function(a){if(0>a)return a-=.5,-2147483648>a?Math.ceil(a):a|0;a+=.5;return 2147483647<a?Math.floor(a):a|0};d.Clipper.Round=r?G:F?I:L?J:H;d.Clipper.TopX=function(a,b){return b==a.Top.Y?a.Top.X:a.Bot.X+d.Clipper.Round(a.Dx*(b-a.Bot.Y))};d.Clipper.prototype.IntersectPoint=function(a,b,c){c.X=0;c.Y=0;var e,f;if(a.Dx==b.Dx)c.Y=a.Curr.Y,c.X=d.Clipper.TopX(a,c.Y);
else{if(0===a.Delta.X)c.X=a.Bot.X,d.ClipperBase.IsHorizontal(b)?c.Y=b.Bot.Y:(f=b.Bot.Y-b.Bot.X/b.Dx,c.Y=d.Clipper.Round(c.X/b.Dx+f));else if(0===b.Delta.X)c.X=b.Bot.X,d.ClipperBase.IsHorizontal(a)?c.Y=a.Bot.Y:(e=a.Bot.Y-a.Bot.X/a.Dx,c.Y=d.Clipper.Round(c.X/a.Dx+e));else{e=a.Bot.X-a.Bot.Y*a.Dx;f=b.Bot.X-b.Bot.Y*b.Dx;var g=(f-e)/(a.Dx-b.Dx);c.Y=d.Clipper.Round(g);c.X=Math.abs(a.Dx)<Math.abs(b.Dx)?d.Clipper.Round(a.Dx*g+e):d.Clipper.Round(b.Dx*g+f)}if(c.Y<a.Top.Y||c.Y<b.Top.Y){if(a.Top.Y>b.Top.Y)return c.Y=
a.Top.Y,c.X=d.Clipper.TopX(b,a.Top.Y),c.X<a.Top.X;c.Y=b.Top.Y;c.X=Math.abs(a.Dx)<Math.abs(b.Dx)?d.Clipper.TopX(a,c.Y):d.Clipper.TopX(b,c.Y)}c.Y>a.Curr.Y&&(c.Y=a.Curr.Y,c.X=Math.abs(a.Dx)>Math.abs(b.Dx)?d.Clipper.TopX(b,c.Y):d.Clipper.TopX(a,c.Y))}};d.Clipper.prototype.ProcessEdgesAtTopOfScanbeam=function(a){for(var b=this.m_ActiveEdges;null!==b;){var c=this.IsMaxima(b,a);c&&(c=this.GetMaximaPair(b),c=null===c||!d.ClipperBase.IsHorizontal(c));if(c){var e=b.PrevInAEL;this.DoMaxima(b);b=null===e?this.m_ActiveEdges:
e.NextInAEL}else{this.IsIntermediate(b,a)&&d.ClipperBase.IsHorizontal(b.NextInLML)?(b=this.UpdateEdgeIntoAEL(b),0<=b.OutIdx&&this.AddOutPt(b,b.Bot),this.AddEdgeToSEL(b)):(b.Curr.X=d.Clipper.TopX(b,a),b.Curr.Y=a);if(this.StrictlySimple&&(e=b.PrevInAEL,0<=b.OutIdx&&0!==b.WindDelta&&null!==e&&0<=e.OutIdx&&e.Curr.X==b.Curr.X&&0!==e.WindDelta)){var f=new d.IntPoint(b.Curr),c=this.AddOutPt(e,f),e=this.AddOutPt(b,f);this.AddJoin(c,e,f)}b=b.NextInAEL}}this.ProcessHorizontals(!0);for(b=this.m_ActiveEdges;null!==
b;)this.IsIntermediate(b,a)&&(c=null,0<=b.OutIdx&&(c=this.AddOutPt(b,b.Top)),b=this.UpdateEdgeIntoAEL(b),e=b.PrevInAEL,f=b.NextInAEL,null!==e&&e.Curr.X==b.Bot.X&&e.Curr.Y==b.Bot.Y&&null!==c&&0<=e.OutIdx&&e.Curr.Y>e.Top.Y&&d.ClipperBase.SlopesEqual(b,e,this.m_UseFullRange)&&0!==b.WindDelta&&0!==e.WindDelta?(e=this.AddOutPt(e,b.Bot),this.AddJoin(c,e,b.Top)):null!==f&&f.Curr.X==b.Bot.X&&f.Curr.Y==b.Bot.Y&&null!==c&&0<=f.OutIdx&&f.Curr.Y>f.Top.Y&&d.ClipperBase.SlopesEqual(b,f,this.m_UseFullRange)&&0!==
b.WindDelta&&0!==f.WindDelta&&(e=this.AddOutPt(f,b.Bot),this.AddJoin(c,e,b.Top))),b=b.NextInAEL};d.Clipper.prototype.DoMaxima=function(a){var b=this.GetMaximaPair(a);if(null===b)0<=a.OutIdx&&this.AddOutPt(a,a.Top),this.DeleteFromAEL(a);else{for(var c=a.NextInAEL;null!==c&&c!=b;)this.IntersectEdges(a,c,a.Top),this.SwapPositionsInAEL(a,c),c=a.NextInAEL;-1==a.OutIdx&&-1==b.OutIdx?(this.DeleteFromAEL(a),this.DeleteFromAEL(b)):0<=a.OutIdx&&0<=b.OutIdx?(0<=a.OutIdx&&this.AddLocalMaxPoly(a,b,a.Top),this.DeleteFromAEL(a),
this.DeleteFromAEL(b)):0===a.WindDelta?(0<=a.OutIdx&&(this.AddOutPt(a,a.Top),a.OutIdx=-1),this.DeleteFromAEL(a),0<=b.OutIdx&&(this.AddOutPt(b,a.Top),b.OutIdx=-1),this.DeleteFromAEL(b)):d.Error("DoMaxima error")}};d.Clipper.ReversePaths=function(a){for(var b=0,c=a.length;b<c;b++)a[b].reverse()};d.Clipper.Orientation=function(a){return 0<=d.Clipper.Area(a)};d.Clipper.prototype.PointCount=function(a){if(null===a)return 0;var b=0,c=a;do b++,c=c.Next;while(c!=a);return b};d.Clipper.prototype.BuildResult=
function(a){d.Clear(a);for(var b=0,c=this.m_PolyOuts.length;b<c;b++){var e=this.m_PolyOuts[b];if(null!==e.Pts){var e=e.Pts.Prev,f=this.PointCount(e);if(!(2>f)){for(var g=Array(f),h=0;h<f;h++)g[h]=e.Pt,e=e.Prev;a.push(g)}}}};d.Clipper.prototype.BuildResult2=function(a){a.Clear();for(var b=0,c=this.m_PolyOuts.length;b<c;b++){var e=this.m_PolyOuts[b],f=this.PointCount(e.Pts);if(!(e.IsOpen&&2>f||!e.IsOpen&&3>f)){this.FixHoleLinkage(e);var g=new d.PolyNode;a.m_AllPolys.push(g);e.PolyNode=g;g.m_polygon.length=
f;for(var e=e.Pts.Prev,h=0;h<f;h++)g.m_polygon[h]=e.Pt,e=e.Prev}}b=0;for(c=this.m_PolyOuts.length;b<c;b++)e=this.m_PolyOuts[b],null!==e.PolyNode&&(e.IsOpen?(e.PolyNode.IsOpen=!0,a.AddChild(e.PolyNode)):null!==e.FirstLeft&&null!=e.FirstLeft.PolyNode?e.FirstLeft.PolyNode.AddChild(e.PolyNode):a.AddChild(e.PolyNode))};d.Clipper.prototype.FixupOutPolygon=function(a){var b=null;a.BottomPt=null;for(var c=a.Pts;;){if(c.Prev==c||c.Prev==c.Next){a.Pts=null;return}if(d.IntPoint.op_Equality(c.Pt,c.Next.Pt)||
d.IntPoint.op_Equality(c.Pt,c.Prev.Pt)||d.ClipperBase.SlopesEqual(c.Prev.Pt,c.Pt,c.Next.Pt,this.m_UseFullRange)&&(!this.PreserveCollinear||!this.Pt2IsBetweenPt1AndPt3(c.Prev.Pt,c.Pt,c.Next.Pt)))b=null,c.Prev.Next=c.Next,c=c.Next.Prev=c.Prev;else if(c==b)break;else null===b&&(b=c),c=c.Next}a.Pts=c};d.Clipper.prototype.DupOutPt=function(a,b){var c=new d.OutPt;c.Pt.X=a.Pt.X;c.Pt.Y=a.Pt.Y;c.Idx=a.Idx;b?(c.Next=a.Next,c.Prev=a,a.Next.Prev=c,a.Next=c):(c.Prev=a.Prev,c.Next=a,a.Prev.Next=c,a.Prev=c);return c};
d.Clipper.prototype.GetOverlap=function(a,b,c,e,d){a<b?c<e?(d.Left=Math.max(a,c),d.Right=Math.min(b,e)):(d.Left=Math.max(a,e),d.Right=Math.min(b,c)):c<e?(d.Left=Math.max(b,c),d.Right=Math.min(a,e)):(d.Left=Math.max(b,e),d.Right=Math.min(a,c));return d.Left<d.Right};d.Clipper.prototype.JoinHorz=function(a,b,c,e,f,g){var h=a.Pt.X>b.Pt.X?d.Direction.dRightToLeft:d.Direction.dLeftToRight;e=c.Pt.X>e.Pt.X?d.Direction.dRightToLeft:d.Direction.dLeftToRight;if(h==e)return!1;if(h==d.Direction.dLeftToRight){for(;a.Next.Pt.X<=
f.X&&a.Next.Pt.X>=a.Pt.X&&a.Next.Pt.Y==f.Y;)a=a.Next;g&&a.Pt.X!=f.X&&(a=a.Next);b=this.DupOutPt(a,!g);d.IntPoint.op_Inequality(b.Pt,f)&&(a=b,a.Pt.X=f.X,a.Pt.Y=f.Y,b=this.DupOutPt(a,!g))}else{for(;a.Next.Pt.X>=f.X&&a.Next.Pt.X<=a.Pt.X&&a.Next.Pt.Y==f.Y;)a=a.Next;g||a.Pt.X==f.X||(a=a.Next);b=this.DupOutPt(a,g);d.IntPoint.op_Inequality(b.Pt,f)&&(a=b,a.Pt.X=f.X,a.Pt.Y=f.Y,b=this.DupOutPt(a,g))}if(e==d.Direction.dLeftToRight){for(;c.Next.Pt.X<=f.X&&c.Next.Pt.X>=c.Pt.X&&c.Next.Pt.Y==f.Y;)c=c.Next;g&&c.Pt.X!=
f.X&&(c=c.Next);e=this.DupOutPt(c,!g);d.IntPoint.op_Inequality(e.Pt,f)&&(c=e,c.Pt.X=f.X,c.Pt.Y=f.Y,e=this.DupOutPt(c,!g))}else{for(;c.Next.Pt.X>=f.X&&c.Next.Pt.X<=c.Pt.X&&c.Next.Pt.Y==f.Y;)c=c.Next;g||c.Pt.X==f.X||(c=c.Next);e=this.DupOutPt(c,g);d.IntPoint.op_Inequality(e.Pt,f)&&(c=e,c.Pt.X=f.X,c.Pt.Y=f.Y,e=this.DupOutPt(c,g))}h==d.Direction.dLeftToRight==g?(a.Prev=c,c.Next=a,b.Next=e,e.Prev=b):(a.Next=c,c.Prev=a,b.Prev=e,e.Next=b);return!0};d.Clipper.prototype.JoinPoints=function(a,b,c){var e=a.OutPt1,
f;new d.OutPt;var g=a.OutPt2,h;new d.OutPt;if((h=a.OutPt1.Pt.Y==a.OffPt.Y)&&d.IntPoint.op_Equality(a.OffPt,a.OutPt1.Pt)&&d.IntPoint.op_Equality(a.OffPt,a.OutPt2.Pt)){if(b!=c)return!1;for(f=a.OutPt1.Next;f!=e&&d.IntPoint.op_Equality(f.Pt,a.OffPt);)f=f.Next;f=f.Pt.Y>a.OffPt.Y;for(h=a.OutPt2.Next;h!=g&&d.IntPoint.op_Equality(h.Pt,a.OffPt);)h=h.Next;if(f==h.Pt.Y>a.OffPt.Y)return!1;f?(f=this.DupOutPt(e,!1),h=this.DupOutPt(g,!0),e.Prev=g,g.Next=e,f.Next=h,h.Prev=f):(f=this.DupOutPt(e,!0),h=this.DupOutPt(g,
!1),e.Next=g,g.Prev=e,f.Prev=h,h.Next=f);a.OutPt1=e;a.OutPt2=f;return!0}if(h){for(f=e;e.Prev.Pt.Y==e.Pt.Y&&e.Prev!=f&&e.Prev!=g;)e=e.Prev;for(;f.Next.Pt.Y==f.Pt.Y&&f.Next!=e&&f.Next!=g;)f=f.Next;if(f.Next==e||f.Next==g)return!1;for(h=g;g.Prev.Pt.Y==g.Pt.Y&&g.Prev!=h&&g.Prev!=f;)g=g.Prev;for(;h.Next.Pt.Y==h.Pt.Y&&h.Next!=g&&h.Next!=e;)h=h.Next;if(h.Next==g||h.Next==e)return!1;c={Left:null,Right:null};if(!this.GetOverlap(e.Pt.X,f.Pt.X,g.Pt.X,h.Pt.X,c))return!1;b=c.Left;var l=c.Right;c=new d.IntPoint;
e.Pt.X>=b&&e.Pt.X<=l?(c.X=e.Pt.X,c.Y=e.Pt.Y,b=e.Pt.X>f.Pt.X):g.Pt.X>=b&&g.Pt.X<=l?(c.X=g.Pt.X,c.Y=g.Pt.Y,b=g.Pt.X>h.Pt.X):f.Pt.X>=b&&f.Pt.X<=l?(c.X=f.Pt.X,c.Y=f.Pt.Y,b=f.Pt.X>e.Pt.X):(c.X=h.Pt.X,c.Y=h.Pt.Y,b=h.Pt.X>g.Pt.X);a.OutPt1=e;a.OutPt2=g;return this.JoinHorz(e,f,g,h,c,b)}for(f=e.Next;d.IntPoint.op_Equality(f.Pt,e.Pt)&&f!=e;)f=f.Next;if(l=f.Pt.Y>e.Pt.Y||!d.ClipperBase.SlopesEqual(e.Pt,f.Pt,a.OffPt,this.m_UseFullRange)){for(f=e.Prev;d.IntPoint.op_Equality(f.Pt,e.Pt)&&f!=e;)f=f.Prev;if(f.Pt.Y>
e.Pt.Y||!d.ClipperBase.SlopesEqual(e.Pt,f.Pt,a.OffPt,this.m_UseFullRange))return!1}for(h=g.Next;d.IntPoint.op_Equality(h.Pt,g.Pt)&&h!=g;)h=h.Next;var k=h.Pt.Y>g.Pt.Y||!d.ClipperBase.SlopesEqual(g.Pt,h.Pt,a.OffPt,this.m_UseFullRange);if(k){for(h=g.Prev;d.IntPoint.op_Equality(h.Pt,g.Pt)&&h!=g;)h=h.Prev;if(h.Pt.Y>g.Pt.Y||!d.ClipperBase.SlopesEqual(g.Pt,h.Pt,a.OffPt,this.m_UseFullRange))return!1}if(f==e||h==g||f==h||b==c&&l==k)return!1;l?(f=this.DupOutPt(e,!1),h=this.DupOutPt(g,!0),e.Prev=g,g.Next=e,
f.Next=h,h.Prev=f):(f=this.DupOutPt(e,!0),h=this.DupOutPt(g,!1),e.Next=g,g.Prev=e,f.Prev=h,h.Next=f);a.OutPt1=e;a.OutPt2=f;return!0};d.Clipper.GetBounds=function(a){for(var b=0,c=a.length;b<c&&0==a[b].length;)b++;if(b==c)return new d.IntRect(0,0,0,0);var e=new d.IntRect;e.left=a[b][0].X;e.right=e.left;e.top=a[b][0].Y;for(e.bottom=e.top;b<c;b++)for(var f=0,g=a[b].length;f<g;f++)a[b][f].X<e.left?e.left=a[b][f].X:a[b][f].X>e.right&&(e.right=a[b][f].X),a[b][f].Y<e.top?e.top=a[b][f].Y:a[b][f].Y>e.bottom&&
(e.bottom=a[b][f].Y);return e};d.Clipper.prototype.GetBounds2=function(a){var b=a,c=new d.IntRect;c.left=a.Pt.X;c.right=a.Pt.X;c.top=a.Pt.Y;c.bottom=a.Pt.Y;for(a=a.Next;a!=b;)a.Pt.X<c.left&&(c.left=a.Pt.X),a.Pt.X>c.right&&(c.right=a.Pt.X),a.Pt.Y<c.top&&(c.top=a.Pt.Y),a.Pt.Y>c.bottom&&(c.bottom=a.Pt.Y),a=a.Next;return c};d.Clipper.PointInPolygon=function(a,b){var c=0,e=b.length;if(3>e)return 0;for(var d=b[0],g=1;g<=e;++g){var h=g==e?b[0]:b[g];if(h.Y==a.Y&&(h.X==a.X||d.Y==a.Y&&h.X>a.X==d.X<a.X))return-1;
if(d.Y<a.Y!=h.Y<a.Y)if(d.X>=a.X)if(h.X>a.X)c=1-c;else{var l=(d.X-a.X)*(h.Y-a.Y)-(h.X-a.X)*(d.Y-a.Y);if(0==l)return-1;0<l==h.Y>d.Y&&(c=1-c)}else if(h.X>a.X){l=(d.X-a.X)*(h.Y-a.Y)-(h.X-a.X)*(d.Y-a.Y);if(0==l)return-1;0<l==h.Y>d.Y&&(c=1-c)}d=h}return c};d.Clipper.prototype.PointInPolygon=function(a,b){var c=0,d=b,f=a.X,g=a.Y,h=b.Pt.X,l=b.Pt.Y;do{b=b.Next;var k=b.Pt.X,n=b.Pt.Y;if(n==g&&(k==f||l==g&&k>f==h<f))return-1;if(l<g!=n<g)if(h>=f)if(k>f)c=1-c;else{h=(h-f)*(n-g)-(k-f)*(l-g);if(0==h)return-1;0<h==
n>l&&(c=1-c)}else if(k>f){h=(h-f)*(n-g)-(k-f)*(l-g);if(0==h)return-1;0<h==n>l&&(c=1-c)}h=k;l=n}while(d!=b);return c};d.Clipper.prototype.Poly2ContainsPoly1=function(a,b){var c=a;do{var d=this.PointInPolygon(c.Pt,b);if(0<=d)return 0<d;c=c.Next}while(c!=a);return!0};d.Clipper.prototype.FixupFirstLefts1=function(a,b){for(var c=0,d=this.m_PolyOuts.length;c<d;c++){var f=this.m_PolyOuts[c];null!=f.Pts&&null!=f.FirstLeft&&this.ParseFirstLeft(f.FirstLeft)==a&&this.Poly2ContainsPoly1(f.Pts,b.Pts)&&(f.FirstLeft=
b)}};d.Clipper.prototype.FixupFirstLefts2=function(a,b){for(var c=0,d=this.m_PolyOuts,f=d.length,g=d[c];c<f;c++,g=d[c])g.FirstLeft==a&&(g.FirstLeft=b)};d.Clipper.ParseFirstLeft=function(a){for(;null!=a&&null==a.Pts;)a=a.FirstLeft;return a};d.Clipper.prototype.JoinCommonEdges=function(){for(var a=0,b=this.m_Joins.length;a<b;a++){var c=this.m_Joins[a],e=this.GetOutRec(c.OutPt1.Idx),f=this.GetOutRec(c.OutPt2.Idx);if(null!=e.Pts&&null!=f.Pts){var g;g=e==f?e:this.Param1RightOfParam2(e,f)?f:this.Param1RightOfParam2(f,
e)?e:this.GetLowermostRec(e,f);if(this.JoinPoints(c,e,f))if(e==f){e.Pts=c.OutPt1;e.BottomPt=null;f=this.CreateOutRec();f.Pts=c.OutPt2;this.UpdateOutPtIdxs(f);if(this.m_UsingPolyTree){g=0;for(var h=this.m_PolyOuts.length;g<h-1;g++){var l=this.m_PolyOuts[g];null!=l.Pts&&d.Clipper.ParseFirstLeft(l.FirstLeft)==e&&l.IsHole!=e.IsHole&&this.Poly2ContainsPoly1(l.Pts,c.OutPt2)&&(l.FirstLeft=f)}}this.Poly2ContainsPoly1(f.Pts,e.Pts)?(f.IsHole=!e.IsHole,f.FirstLeft=e,this.m_UsingPolyTree&&this.FixupFirstLefts2(f,
e),(f.IsHole^this.ReverseSolution)==0<this.Area(f)&&this.ReversePolyPtLinks(f.Pts)):this.Poly2ContainsPoly1(e.Pts,f.Pts)?(f.IsHole=e.IsHole,e.IsHole=!f.IsHole,f.FirstLeft=e.FirstLeft,e.FirstLeft=f,this.m_UsingPolyTree&&this.FixupFirstLefts2(e,f),(e.IsHole^this.ReverseSolution)==0<this.Area(e)&&this.ReversePolyPtLinks(e.Pts)):(f.IsHole=e.IsHole,f.FirstLeft=e.FirstLeft,this.m_UsingPolyTree&&this.FixupFirstLefts1(e,f))}else f.Pts=null,f.BottomPt=null,f.Idx=e.Idx,e.IsHole=g.IsHole,g==f&&(e.FirstLeft=
f.FirstLeft),f.FirstLeft=e,this.m_UsingPolyTree&&this.FixupFirstLefts2(f,e)}}};d.Clipper.prototype.UpdateOutPtIdxs=function(a){var b=a.Pts;do b.Idx=a.Idx,b=b.Prev;while(b!=a.Pts)};d.Clipper.prototype.DoSimplePolygons=function(){for(var a=0;a<this.m_PolyOuts.length;){var b=this.m_PolyOuts[a++],c=b.Pts;if(null!=c&&!b.IsOpen){do{for(var e=c.Next;e!=b.Pts;){if(d.IntPoint.op_Equality(c.Pt,e.Pt)&&e.Next!=c&&e.Prev!=c){var f=c.Prev,g=e.Prev;c.Prev=g;g.Next=c;e.Prev=f;f.Next=e;b.Pts=c;f=this.CreateOutRec();
f.Pts=e;this.UpdateOutPtIdxs(f);this.Poly2ContainsPoly1(f.Pts,b.Pts)?(f.IsHole=!b.IsHole,f.FirstLeft=b,this.m_UsingPolyTree&&this.FixupFirstLefts2(f,b)):this.Poly2ContainsPoly1(b.Pts,f.Pts)?(f.IsHole=b.IsHole,b.IsHole=!f.IsHole,f.FirstLeft=b.FirstLeft,b.FirstLeft=f,this.m_UsingPolyTree&&this.FixupFirstLefts2(b,f)):(f.IsHole=b.IsHole,f.FirstLeft=b.FirstLeft,this.m_UsingPolyTree&&this.FixupFirstLefts1(b,f));e=c}e=e.Next}c=c.Next}while(c!=b.Pts)}}};d.Clipper.Area=function(a){var b=a.length;if(3>b)return 0;
for(var c=0,d=0,f=b-1;d<b;++d)c+=(a[f].X+a[d].X)*(a[f].Y-a[d].Y),f=d;return.5*-c};d.Clipper.prototype.Area=function(a){var b=a.Pts;if(null==b)return 0;var c=0;do c+=(b.Prev.Pt.X+b.Pt.X)*(b.Prev.Pt.Y-b.Pt.Y),b=b.Next;while(b!=a.Pts);return.5*c};d.Clipper.SimplifyPolygon=function(a,b){var c=[],e=new d.Clipper(0);e.StrictlySimple=!0;e.AddPath(a,d.PolyType.ptSubject,!0);e.Execute(d.ClipType.ctUnion,c,b,b);return c};d.Clipper.SimplifyPolygons=function(a,b){"undefined"==typeof b&&(b=d.PolyFillType.pftEvenOdd);
var c=[],e=new d.Clipper(0);e.StrictlySimple=!0;e.AddPaths(a,d.PolyType.ptSubject,!0);e.Execute(d.ClipType.ctUnion,c,b,b);return c};d.Clipper.DistanceSqrd=function(a,b){var c=a.X-b.X,d=a.Y-b.Y;return c*c+d*d};d.Clipper.DistanceFromLineSqrd=function(a,b,c){var d=b.Y-c.Y;c=c.X-b.X;b=d*b.X+c*b.Y;b=d*a.X+c*a.Y-b;return b*b/(d*d+c*c)};d.Clipper.SlopesNearCollinear=function(a,b,c,e){return Math.abs(a.X-b.X)>Math.abs(a.Y-b.Y)?a.X>b.X==a.X<c.X?d.Clipper.DistanceFromLineSqrd(a,b,c)<e:b.X>a.X==b.X<c.X?d.Clipper.DistanceFromLineSqrd(b,
a,c)<e:d.Clipper.DistanceFromLineSqrd(c,a,b)<e:a.Y>b.Y==a.Y<c.Y?d.Clipper.DistanceFromLineSqrd(a,b,c)<e:b.Y>a.Y==b.Y<c.Y?d.Clipper.DistanceFromLineSqrd(b,a,c)<e:d.Clipper.DistanceFromLineSqrd(c,a,b)<e};d.Clipper.PointsAreClose=function(a,b,c){var d=a.X-b.X;a=a.Y-b.Y;return d*d+a*a<=c};d.Clipper.ExcludeOp=function(a){var b=a.Prev;b.Next=a.Next;a.Next.Prev=b;b.Idx=0;return b};d.Clipper.CleanPolygon=function(a,b){"undefined"==typeof b&&(b=1.415);var c=a.length;if(0==c)return[];for(var e=Array(c),f=0;f<
c;++f)e[f]=new d.OutPt;for(f=0;f<c;++f)e[f].Pt=a[f],e[f].Next=e[(f+1)%c],e[f].Next.Prev=e[f],e[f].Idx=0;f=b*b;for(e=e[0];0==e.Idx&&e.Next!=e.Prev;)d.Clipper.PointsAreClose(e.Pt,e.Prev.Pt,f)?(e=d.Clipper.ExcludeOp(e),c--):d.Clipper.PointsAreClose(e.Prev.Pt,e.Next.Pt,f)?(d.Clipper.ExcludeOp(e.Next),e=d.Clipper.ExcludeOp(e),c-=2):d.Clipper.SlopesNearCollinear(e.Prev.Pt,e.Pt,e.Next.Pt,f)?(e=d.Clipper.ExcludeOp(e),c--):(e.Idx=1,e=e.Next);3>c&&(c=0);for(var g=Array(c),f=0;f<c;++f)g[f]=new d.IntPoint(e.Pt),
e=e.Next;return g};d.Clipper.CleanPolygons=function(a,b){for(var c=Array(a.length),e=0,f=a.length;e<f;e++)c[e]=d.Clipper.CleanPolygon(a[e],b);return c};d.Clipper.Minkowski=function(a,b,c,e){e=e?1:0;var f=a.length,g=b.length,h=[];if(c)for(c=0;c<g;c++){for(var l=Array(f),k=0,n=a.length,p=a[k];k<n;k++,p=a[k])l[k]=new d.IntPoint(b[c].X+p.X,b[c].Y+p.Y);h.push(l)}else for(c=0;c<g;c++){l=Array(f);k=0;n=a.length;for(p=a[k];k<n;k++,p=a[k])l[k]=new d.IntPoint(b[c].X-p.X,b[c].Y-p.Y);h.push(l)}a=[];for(c=0;c<
g-1+e;c++)for(k=0;k<f;k++)b=[],b.push(h[c%g][k%f]),b.push(h[(c+1)%g][k%f]),b.push(h[(c+1)%g][(k+1)%f]),b.push(h[c%g][(k+1)%f]),d.Clipper.Orientation(b)||b.reverse(),a.push(b);return a};d.Clipper.MinkowskiSum=function(a,b,c){if(b[0]instanceof Array){h=b;b=new d.Paths;for(var e=new d.Clipper,f=0;f<h.length;++f){var g=d.Clipper.Minkowski(a,h[f],!0,c);e.AddPaths(g,d.PolyType.ptSubject,!0);c&&(g=d.Clipper.TranslatePath(h[f],a[0]),e.AddPath(g,d.PolyType.ptClip,!0))}e.Execute(d.ClipType.ctUnion,b,d.PolyFillType.pftNonZero,
d.PolyFillType.pftNonZero);return b}var h=d.Clipper.Minkowski(a,b,!0,c),e=new d.Clipper;e.AddPaths(h,d.PolyType.ptSubject,!0);e.Execute(d.ClipType.ctUnion,h,d.PolyFillType.pftNonZero,d.PolyFillType.pftNonZero);return h};d.Clipper.TranslatePath=function(a,b){for(var c=new d.Path,e=0;e<a.length;e++)c.push(new d.IntPoint(a[e].X+b.X,a[e].Y+b.Y));return c};d.Clipper.MinkowskiDiff=function(a,b){var c=d.Clipper.Minkowski(a,b,!1,!0),e=new d.Clipper;e.AddPaths(c,d.PolyType.ptSubject,!0);e.Execute(d.ClipType.ctUnion,
c,d.PolyFillType.pftNonZero,d.PolyFillType.pftNonZero);return c};d.Clipper.PolyTreeToPaths=function(a){var b=[];d.Clipper.AddPolyNodeToPaths(a,d.Clipper.NodeType.ntAny,b);return b};d.Clipper.AddPolyNodeToPaths=function(a,b,c){var e=!0;switch(b){case d.Clipper.NodeType.ntOpen:return;case d.Clipper.NodeType.ntClosed:e=!a.IsOpen}0<a.m_polygon.length&&e&&c.push(a.m_polygon);e=0;a=a.Childs();for(var f=a.length,g=a[e];e<f;e++,g=a[e])d.Clipper.AddPolyNodeToPaths(g,b,c)};d.Clipper.OpenPathsFromPolyTree=function(a){for(var b=
new d.Paths,c=0,e=a.ChildCount();c<e;c++)a.Childs()[c].IsOpen&&b.push(a.Childs()[c].m_polygon);return b};d.Clipper.ClosedPathsFromPolyTree=function(a){var b=new d.Paths;d.Clipper.AddPolyNodeToPaths(a,d.Clipper.NodeType.ntClosed,b);return b};q(d.Clipper,d.ClipperBase);d.Clipper.NodeType={ntAny:0,ntOpen:1,ntClosed:2};d.ClipperOffset=function(a,b){"undefined"==typeof a&&(a=2);"undefined"==typeof b&&(b=d.ClipperOffset.def_arc_tolerance);this.m_destPolys=new d.Paths;this.m_srcPoly=new d.Path;this.m_destPoly=
new d.Path;this.m_normals=[];this.m_StepsPerRad=this.m_miterLim=this.m_cos=this.m_sin=this.m_sinA=this.m_delta=0;this.m_lowest=new d.IntPoint;this.m_polyNodes=new d.PolyNode;this.MiterLimit=a;this.ArcTolerance=b;this.m_lowest.X=-1};d.ClipperOffset.two_pi=6.28318530717959;d.ClipperOffset.def_arc_tolerance=.25;d.ClipperOffset.prototype.Clear=function(){d.Clear(this.m_polyNodes.Childs());this.m_lowest.X=-1};d.ClipperOffset.Round=d.Clipper.Round;d.ClipperOffset.prototype.AddPath=function(a,b,c){var e=
a.length-1;if(!(0>e)){var f=new d.PolyNode;f.m_jointype=b;f.m_endtype=c;if(c==d.EndType.etClosedLine||c==d.EndType.etClosedPolygon)for(;0<e&&d.IntPoint.op_Equality(a[0],a[e]);)e--;f.m_polygon.push(a[0]);var g=0;b=0;for(var h=1;h<=e;h++)d.IntPoint.op_Inequality(f.m_polygon[g],a[h])&&(g++,f.m_polygon.push(a[h]),a[h].Y>f.m_polygon[b].Y||a[h].Y==f.m_polygon[b].Y&&a[h].X<f.m_polygon[b].X)&&(b=g);if(!(c==d.EndType.etClosedPolygon&&2>g)&&(this.m_polyNodes.AddChild(f),c==d.EndType.etClosedPolygon))if(0>this.m_lowest.X)this.m_lowest=
new d.IntPoint(this.m_polyNodes.ChildCount()-1,b);else if(a=this.m_polyNodes.Childs()[this.m_lowest.X].m_polygon[this.m_lowest.Y],f.m_polygon[b].Y>a.Y||f.m_polygon[b].Y==a.Y&&f.m_polygon[b].X<a.X)this.m_lowest=new d.IntPoint(this.m_polyNodes.ChildCount()-1,b)}};d.ClipperOffset.prototype.AddPaths=function(a,b,c){for(var d=0,f=a.length;d<f;d++)this.AddPath(a[d],b,c)};d.ClipperOffset.prototype.FixOrientations=function(){if(0<=this.m_lowest.X&&!d.Clipper.Orientation(this.m_polyNodes.Childs()[this.m_lowest.X].m_polygon))for(var a=
0;a<this.m_polyNodes.ChildCount();a++){var b=this.m_polyNodes.Childs()[a];(b.m_endtype==d.EndType.etClosedPolygon||b.m_endtype==d.EndType.etClosedLine&&d.Clipper.Orientation(b.m_polygon))&&b.m_polygon.reverse()}else for(a=0;a<this.m_polyNodes.ChildCount();a++)b=this.m_polyNodes.Childs()[a],b.m_endtype!=d.EndType.etClosedLine||d.Clipper.Orientation(b.m_polygon)||b.m_polygon.reverse()};d.ClipperOffset.GetUnitNormal=function(a,b){var c=b.X-a.X,e=b.Y-a.Y;if(0==c&&0==e)return new d.DoublePoint(0,0);var f=
1/Math.sqrt(c*c+e*e);return new d.DoublePoint(e*f,-(c*f))};d.ClipperOffset.prototype.DoOffset=function(a){this.m_destPolys=[];this.m_delta=a;if(d.ClipperBase.near_zero(a))for(var b=0;b<this.m_polyNodes.ChildCount();b++){var c=this.m_polyNodes.Childs()[b];c.m_endtype==d.EndType.etClosedPolygon&&this.m_destPolys.push(c.m_polygon)}else{this.m_miterLim=2<this.MiterLimit?2/(this.MiterLimit*this.MiterLimit):.5;var e=3.14159265358979/Math.acos(1-(0>=this.ArcTolerance?d.ClipperOffset.def_arc_tolerance:this.ArcTolerance>
Math.abs(a)*d.ClipperOffset.def_arc_tolerance?Math.abs(a)*d.ClipperOffset.def_arc_tolerance:this.ArcTolerance)/Math.abs(a));this.m_sin=Math.sin(d.ClipperOffset.two_pi/e);this.m_cos=Math.cos(d.ClipperOffset.two_pi/e);this.m_StepsPerRad=e/d.ClipperOffset.two_pi;0>a&&(this.m_sin=-this.m_sin);for(b=0;b<this.m_polyNodes.ChildCount();b++){c=this.m_polyNodes.Childs()[b];this.m_srcPoly=c.m_polygon;var f=this.m_srcPoly.length;if(!(0==f||0>=a&&(3>f||c.m_endtype!=d.EndType.etClosedPolygon))){this.m_destPoly=
[];if(1==f)if(c.m_jointype==d.JoinType.jtRound)for(var c=1,f=0,g=1;g<=e;g++){this.m_destPoly.push(new d.IntPoint(d.ClipperOffset.Round(this.m_srcPoly[0].X+c*a),d.ClipperOffset.Round(this.m_srcPoly[0].Y+f*a)));var h=c,c=c*this.m_cos-this.m_sin*f,f=h*this.m_sin+f*this.m_cos}else for(f=c=-1,g=0;4>g;++g)this.m_destPoly.push(new d.IntPoint(d.ClipperOffset.Round(this.m_srcPoly[0].X+c*a),d.ClipperOffset.Round(this.m_srcPoly[0].Y+f*a))),0>c?c=1:0>f?f=1:c=-1;else{for(g=this.m_normals.length=0;g<f-1;g++)this.m_normals.push(d.ClipperOffset.GetUnitNormal(this.m_srcPoly[g],
this.m_srcPoly[g+1]));c.m_endtype==d.EndType.etClosedLine||c.m_endtype==d.EndType.etClosedPolygon?this.m_normals.push(d.ClipperOffset.GetUnitNormal(this.m_srcPoly[f-1],this.m_srcPoly[0])):this.m_normals.push(new d.DoublePoint(this.m_normals[f-2]));if(c.m_endtype==d.EndType.etClosedPolygon)for(h=f-1,g=0;g<f;g++)h=this.OffsetPoint(g,h,c.m_jointype);else if(c.m_endtype==d.EndType.etClosedLine){h=f-1;for(g=0;g<f;g++)h=this.OffsetPoint(g,h,c.m_jointype);this.m_destPolys.push(this.m_destPoly);this.m_destPoly=
[];h=this.m_normals[f-1];for(g=f-1;0<g;g--)this.m_normals[g]=new d.DoublePoint(-this.m_normals[g-1].X,-this.m_normals[g-1].Y);this.m_normals[0]=new d.DoublePoint(-h.X,-h.Y);h=0;for(g=f-1;0<=g;g--)h=this.OffsetPoint(g,h,c.m_jointype)}else{h=0;for(g=1;g<f-1;++g)h=this.OffsetPoint(g,h,c.m_jointype);c.m_endtype==d.EndType.etOpenButt?(g=f-1,h=new d.IntPoint(d.ClipperOffset.Round(this.m_srcPoly[g].X+this.m_normals[g].X*a),d.ClipperOffset.Round(this.m_srcPoly[g].Y+this.m_normals[g].Y*a)),this.m_destPoly.push(h),
h=new d.IntPoint(d.ClipperOffset.Round(this.m_srcPoly[g].X-this.m_normals[g].X*a),d.ClipperOffset.Round(this.m_srcPoly[g].Y-this.m_normals[g].Y*a)),this.m_destPoly.push(h)):(g=f-1,h=f-2,this.m_sinA=0,this.m_normals[g]=new d.DoublePoint(-this.m_normals[g].X,-this.m_normals[g].Y),c.m_endtype==d.EndType.etOpenSquare?this.DoSquare(g,h):this.DoRound(g,h));for(g=f-1;0<g;g--)this.m_normals[g]=new d.DoublePoint(-this.m_normals[g-1].X,-this.m_normals[g-1].Y);this.m_normals[0]=new d.DoublePoint(-this.m_normals[1].X,
-this.m_normals[1].Y);h=f-1;for(g=h-1;0<g;--g)h=this.OffsetPoint(g,h,c.m_jointype);c.m_endtype==d.EndType.etOpenButt?(h=new d.IntPoint(d.ClipperOffset.Round(this.m_srcPoly[0].X-this.m_normals[0].X*a),d.ClipperOffset.Round(this.m_srcPoly[0].Y-this.m_normals[0].Y*a)),this.m_destPoly.push(h),h=new d.IntPoint(d.ClipperOffset.Round(this.m_srcPoly[0].X+this.m_normals[0].X*a),d.ClipperOffset.Round(this.m_srcPoly[0].Y+this.m_normals[0].Y*a)),this.m_destPoly.push(h)):(this.m_sinA=0,c.m_endtype==d.EndType.etOpenSquare?
this.DoSquare(0,1):this.DoRound(0,1))}}this.m_destPolys.push(this.m_destPoly)}}}};d.ClipperOffset.prototype.Execute=function(){var a=arguments;if(a[0]instanceof d.PolyTree)if(b=a[0],c=a[1],b.Clear(),this.FixOrientations(),this.DoOffset(c),a=new d.Clipper(0),a.AddPaths(this.m_destPolys,d.PolyType.ptSubject,!0),0<c)a.Execute(d.ClipType.ctUnion,b,d.PolyFillType.pftPositive,d.PolyFillType.pftPositive);else if(c=d.Clipper.GetBounds(this.m_destPolys),e=new d.Path,e.push(new d.IntPoint(c.left-10,c.bottom+
10)),e.push(new d.IntPoint(c.right+10,c.bottom+10)),e.push(new d.IntPoint(c.right+10,c.top-10)),e.push(new d.IntPoint(c.left-10,c.top-10)),a.AddPath(e,d.PolyType.ptSubject,!0),a.ReverseSolution=!0,a.Execute(d.ClipType.ctUnion,b,d.PolyFillType.pftNegative,d.PolyFillType.pftNegative),1==b.ChildCount()&&0<b.Childs()[0].ChildCount())for(a=b.Childs()[0],b.Childs()[0]=a.Childs()[0],b.Childs()[0].m_Parent=b,c=1;c<a.ChildCount();c++)b.AddChild(a.Childs()[c]);else b.Clear();else{var b=a[0],c=a[1];d.Clear(b);
this.FixOrientations();this.DoOffset(c);a=new d.Clipper(0);a.AddPaths(this.m_destPolys,d.PolyType.ptSubject,!0);if(0<c)a.Execute(d.ClipType.ctUnion,b,d.PolyFillType.pftPositive,d.PolyFillType.pftPositive);else{var c=d.Clipper.GetBounds(this.m_destPolys),e=new d.Path;e.push(new d.IntPoint(c.left-10,c.bottom+10));e.push(new d.IntPoint(c.right+10,c.bottom+10));e.push(new d.IntPoint(c.right+10,c.top-10));e.push(new d.IntPoint(c.left-10,c.top-10));a.AddPath(e,d.PolyType.ptSubject,!0);a.ReverseSolution=
!0;a.Execute(d.ClipType.ctUnion,b,d.PolyFillType.pftNegative,d.PolyFillType.pftNegative);0<b.length&&b.splice(0,1)}}};d.ClipperOffset.prototype.OffsetPoint=function(a,b,c){this.m_sinA=this.m_normals[b].X*this.m_normals[a].Y-this.m_normals[a].X*this.m_normals[b].Y;if(1>Math.abs(this.m_sinA*this.m_delta)){if(0<this.m_normals[b].X*this.m_normals[a].X+this.m_normals[a].Y*this.m_normals[b].Y)return this.m_destPoly.push(new d.IntPoint(d.ClipperOffset.Round(this.m_srcPoly[a].X+this.m_normals[b].X*this.m_delta),
d.ClipperOffset.Round(this.m_srcPoly[a].Y+this.m_normals[b].Y*this.m_delta))),b}else 1<this.m_sinA?this.m_sinA=1:-1>this.m_sinA&&(this.m_sinA=-1);if(0>this.m_sinA*this.m_delta)this.m_destPoly.push(new d.IntPoint(d.ClipperOffset.Round(this.m_srcPoly[a].X+this.m_normals[b].X*this.m_delta),d.ClipperOffset.Round(this.m_srcPoly[a].Y+this.m_normals[b].Y*this.m_delta))),this.m_destPoly.push(new d.IntPoint(this.m_srcPoly[a])),this.m_destPoly.push(new d.IntPoint(d.ClipperOffset.Round(this.m_srcPoly[a].X+this.m_normals[a].X*
this.m_delta),d.ClipperOffset.Round(this.m_srcPoly[a].Y+this.m_normals[a].Y*this.m_delta)));else switch(c){case d.JoinType.jtMiter:c=1+(this.m_normals[a].X*this.m_normals[b].X+this.m_normals[a].Y*this.m_normals[b].Y);c>=this.m_miterLim?this.DoMiter(a,b,c):this.DoSquare(a,b);break;case d.JoinType.jtSquare:this.DoSquare(a,b);break;case d.JoinType.jtRound:this.DoRound(a,b)}return a};d.ClipperOffset.prototype.DoSquare=function(a,b){var c=Math.tan(Math.atan2(this.m_sinA,this.m_normals[b].X*this.m_normals[a].X+
this.m_normals[b].Y*this.m_normals[a].Y)/4);this.m_destPoly.push(new d.IntPoint(d.ClipperOffset.Round(this.m_srcPoly[a].X+this.m_delta*(this.m_normals[b].X-this.m_normals[b].Y*c)),d.ClipperOffset.Round(this.m_srcPoly[a].Y+this.m_delta*(this.m_normals[b].Y+this.m_normals[b].X*c))));this.m_destPoly.push(new d.IntPoint(d.ClipperOffset.Round(this.m_srcPoly[a].X+this.m_delta*(this.m_normals[a].X+this.m_normals[a].Y*c)),d.ClipperOffset.Round(this.m_srcPoly[a].Y+this.m_delta*(this.m_normals[a].Y-this.m_normals[a].X*
c))))};d.ClipperOffset.prototype.DoMiter=function(a,b,c){c=this.m_delta/c;this.m_destPoly.push(new d.IntPoint(d.ClipperOffset.Round(this.m_srcPoly[a].X+(this.m_normals[b].X+this.m_normals[a].X)*c),d.ClipperOffset.Round(this.m_srcPoly[a].Y+(this.m_normals[b].Y+this.m_normals[a].Y)*c)))};d.ClipperOffset.prototype.DoRound=function(a,b){for(var c=Math.max(d.Cast_Int32(d.ClipperOffset.Round(this.m_StepsPerRad*Math.abs(Math.atan2(this.m_sinA,this.m_normals[b].X*this.m_normals[a].X+this.m_normals[b].Y*this.m_normals[a].Y)))),
1),e=this.m_normals[b].X,f=this.m_normals[b].Y,g,h=0;h<c;++h)this.m_destPoly.push(new d.IntPoint(d.ClipperOffset.Round(this.m_srcPoly[a].X+e*this.m_delta),d.ClipperOffset.Round(this.m_srcPoly[a].Y+f*this.m_delta))),g=e,e=e*this.m_cos-this.m_sin*f,f=g*this.m_sin+f*this.m_cos;this.m_destPoly.push(new d.IntPoint(d.ClipperOffset.Round(this.m_srcPoly[a].X+this.m_normals[a].X*this.m_delta),d.ClipperOffset.Round(this.m_srcPoly[a].Y+this.m_normals[a].Y*this.m_delta)))};d.Error=function(a){try{throw Error(a);
}catch(b){alert(b.message)}};d.JS={};d.JS.AreaOfPolygon=function(a,b){b||(b=1);return d.Clipper.Area(a)/(b*b)};d.JS.AreaOfPolygons=function(a,b){b||(b=1);for(var c=0,e=0;e<a.length;e++)c+=d.Clipper.Area(a[e]);return c/(b*b)};d.JS.BoundsOfPath=function(a,b){return d.JS.BoundsOfPaths([a],b)};d.JS.BoundsOfPaths=function(a,b){b||(b=1);var c=d.Clipper.GetBounds(a);c.left/=b;c.bottom/=b;c.right/=b;c.top/=b;return c};d.JS.Clean=function(a,b){if(!(a instanceof Array))return[];var c=a[0]instanceof Array;a=
d.JS.Clone(a);if("number"!=typeof b||null===b)return d.Error("Delta is not a number in Clean()."),a;if(0===a.length||1==a.length&&0===a[0].length||0>b)return a;c||(a=[a]);for(var e=a.length,f,g,h,k,v,n,p,m=[],q=0;q<e;q++)if(g=a[q],f=g.length,0!==f)if(3>f)h=g,m.push(h);else{h=g;k=b*b;v=g[0];for(p=n=1;p<f;p++)(g[p].X-v.X)*(g[p].X-v.X)+(g[p].Y-v.Y)*(g[p].Y-v.Y)<=k||(h[n]=g[p],v=g[p],n++);v=g[n-1];(g[0].X-v.X)*(g[0].X-v.X)+(g[0].Y-v.Y)*(g[0].Y-v.Y)<=k&&n--;n<f&&h.splice(n,f-n);h.length&&m.push(h)}!c&&
m.length?m=m[0]:c||0!==m.length?c&&0===m.length&&(m=[[]]):m=[];return m};d.JS.Clone=function(a){if(!(a instanceof Array)||0===a.length)return[];if(1==a.length&&0===a[0].length)return[[]];var b=a[0]instanceof Array;b||(a=[a]);var c=a.length,d,f,g,h,k=Array(c);for(f=0;f<c;f++){d=a[f].length;h=Array(d);for(g=0;g<d;g++)h[g]={X:a[f][g].X,Y:a[f][g].Y};k[f]=h}b||(k=k[0]);return k};d.JS.Lighten=function(a,b){if(!(a instanceof Array))return[];if("number"!=typeof b||null===b)return d.Error("Tolerance is not a number in Lighten()."),
d.JS.Clone(a);if(0===a.length||1==a.length&&0===a[0].length||0>b)return d.JS.Clone(a);a[0]instanceof Array||(a=[a]);var c,e,f,g,h,k,m,n,p,q,r,t,u,w,x,A=a.length,B=b*b,z=[];for(c=0;c<A;c++)if(f=a[c],k=f.length,0!=k){for(g=0;1E6>g;g++){h=[];k=f.length;f[k-1].X!=f[0].X||f[k-1].Y!=f[0].Y?(r=1,f.push({X:f[0].X,Y:f[0].Y}),k=f.length):r=0;q=[];for(e=0;e<k-2;e++){m=f[e];p=f[e+1];n=f[e+2];w=m.X;x=m.Y;m=n.X-w;t=n.Y-x;if(0!==m||0!==t)u=((p.X-w)*m+(p.Y-x)*t)/(m*m+t*t),1<u?(w=n.X,x=n.Y):0<u&&(w+=m*u,x+=t*u);m=
p.X-w;t=p.Y-x;n=m*m+t*t;n<=B&&(q[e+1]=1,e++)}h.push({X:f[0].X,Y:f[0].Y});for(e=1;e<k-1;e++)q[e]||h.push({X:f[e].X,Y:f[e].Y});h.push({X:f[k-1].X,Y:f[k-1].Y});r&&f.pop();if(q.length)f=h;else break}k=h.length;h[k-1].X==h[0].X&&h[k-1].Y==h[0].Y&&h.pop();2<h.length&&z.push(h)}a[0]instanceof Array||(z=z[0]);"undefined"==typeof z&&(z=[[]]);return z};d.JS.PerimeterOfPath=function(a,b,c){if("undefined"==typeof a)return 0;var d=Math.sqrt,f=0,g,h,k,m,n=a.length;if(2>n)return 0;b&&(a[n]=a[0],n++);for(;--n;)g=
a[n],k=g.X,g=g.Y,h=a[n-1],m=h.X,h=h.Y,f+=d((k-m)*(k-m)+(g-h)*(g-h));b&&a.pop();return f/c};d.JS.PerimeterOfPaths=function(a,b,c){c||(c=1);for(var e=0,f=0;f<a.length;f++)e+=d.JS.PerimeterOfPath(a[f],b,c);return e};d.JS.ScaleDownPath=function(a,b){var c,d;b||(b=1);for(c=a.length;c--;)d=a[c],d.X/=b,d.Y/=b};d.JS.ScaleDownPaths=function(a,b){var c,d,f;b||(b=1);for(c=a.length;c--;)for(d=a[c].length;d--;)f=a[c][d],f.X/=b,f.Y/=b};d.JS.ScaleUpPath=function(a,b){var c,d,f=Math.round;b||(b=1);for(c=a.length;c--;)d=
a[c],d.X=f(d.X*b),d.Y=f(d.Y*b)};d.JS.ScaleUpPaths=function(a,b){var c,d,f,g=Math.round;b||(b=1);for(c=a.length;c--;)for(d=a[c].length;d--;)f=a[c][d],f.X=g(f.X*b),f.Y=g(f.Y*b)};d.ExPolygons=function(){return[]};d.ExPolygon=function(){this.holes=this.outer=null};d.JS.AddOuterPolyNodeToExPolygons=function(a,b){var c=new d.ExPolygon;c.outer=a.Contour();var e=a.Childs(),f=e.length;c.holes=Array(f);var g,h,k,m,n;for(h=0;h<f;h++)for(g=e[h],c.holes[h]=g.Contour(),k=0,m=g.Childs(),n=m.length;k<n;k++)g=m[k],
d.JS.AddOuterPolyNodeToExPolygons(g,b);b.push(c)};d.JS.ExPolygonsToPaths=function(a){var b,c,e,f,g=new d.Paths;b=0;for(e=a.length;b<e;b++)for(g.push(a[b].outer),c=0,f=a[b].holes.length;c<f;c++)g.push(a[b].holes[c]);return g};d.JS.PolyTreeToExPolygons=function(a){var b=new d.ExPolygons,c,e,f;c=0;e=a.Childs();for(f=e.length;c<f;c++)a=e[c],d.JS.AddOuterPolyNodeToExPolygons(a,b);return b}})();function DrawingContext(target_widget) {

    var that = this;

    that.clip_paths = [];

    //This function uses clipper to determine a clipping
    //region based on the target widget's base rectangle
    //and the list of widgets overlapping it.
    that.init_clip = function() {

        var clipper       = new ClipperLib.Clipper(),
            clipping_paths = [];
        
        //Set the client rect as the subject polygon
        clipper.AddPath(
            [
                {X: target_widget.x, Y: target_widget.y},
                {X: target_widget.x + target_widget.width, Y: target_widget.y},
                {X: target_widget.x + target_widget.width, Y: target_widget.y + target_widget.height},
                {X: target_widget.x, Y: target_widget.y + target_widget.height}
            ],
            ClipperLib.PolyType.ptSubject,
            true
        ); 

        //Get the list of overlapping widgets from the 
        //owning uimanager
        var overlap_widgets = target_widget.parent.children_above(target_widget);

        //Add the bounds of each overlapping widget to
        //the clipper as part of the clipping path
        overlap_widgets.forEach(function(widget) {
     
            if(widget.visible !== true)
                return;
            
            var temp_clipper = new ClipperLib.Clipper();      

            temp_clipper.AddPath(
                [
                    {X: widget.x, Y: widget.y},
                    {X: widget.x + widget.width, Y: widget.y},
                    {X: widget.x + widget.width, Y: widget.y + widget.height},
                    {X: widget.x, Y: widget.y + widget.height}
                ],
                ClipperLib.PolyType.ptSubject,
                true
            );

            temp_clipper.AddPaths(
                clipping_paths,
                ClipperLib.PolyType.ptClip,
                true
            );

            temp_clipper.Execute(
                ClipperLib.ClipType.ctUnion,
                clipping_paths,
                ClipperLib.PolyFillType.pftEvenOdd,
                ClipperLib.PolyFillType.pftEvenOdd
            );                
        });
        
        //With our paths entered, set the clipping mode and do the clip
        that.clip_paths = [];

        clipper.AddPaths(
            clipping_paths,
            ClipperLib.PolyType.ptClip,
            true
        );

        clipper.Execute(
            ClipperLib.ClipType.ctDifference,
            that.clip_paths,
            ClipperLib.PolyFillType.pftEvenOdd,
            ClipperLib.PolyFillType.pftEvenOdd
        );                             
    }

    //Applies the clipping path to the parent canvas and
    //sets the canvas transform so that 0, 0 is at the
    //upper lefthand corner of the widget
    that.apply_clip = function() {

        var ctx = target_widget.parent.context;

        ctx.beginPath();

        that.clip_paths.forEach(function(path) {
            
            for(var i = 0; i < path.length + 1; i += 1) {

                if(i === 0)
                    ctx.moveTo(path[i].X, path[i].Y);
                else
                    ctx.lineTo(path[i%path.length].X, path[i%path.length].Y);
            }
        });

        ctx.clip();
        ctx.translate(target_widget.x, target_widget.y);        
    }

    //Debug function to draw lines along the clip path
    that.show_clip = function() {

        var ctx = target_widget.parent.context;

        ctx.beginPath();

        that.clip_paths.forEach(function(path) {
            
            for(var i = 0; i < path.length + 1; i += 1) {

                if(i === 0)
                    ctx.moveTo(path[i].X, path[i].Y);
                else
                    ctx.lineTo(path[i%path.length].X, path[i%path.length].Y);
            }
        });

        ctx.strokeStyle = "#00FF00";
        ctx.stroke();
    }
}
function Frame(x, y, width, height) {

    var that = this;

    that.x = x;
    that.y = y;
    that.width = width;
    that.height = height;
    that.parent = null;

    that.onmousedown = function(x, y) {
 
        this.dragged = true;
        this.drag_x = x;
        this.drag_y = y;
    };

    that.onmouseup = this.onmouseout = function(x, y) {
    
        this.dragged = false;
    };

    that.onmousemove = function(x, y) {

        if(this.dragged === true) {

            this.move(
                (this.x + x) - this.drag_x,
                (this.y + y) - this.drag_y
            ); 
        }
    };

    that.paint = function(ctx) {

        var gradient = ctx.createLinearGradient(0, 2, 0, that.height - 4);
        gradient.addColorStop(0, 'rgb(225, 235, 255)');
        gradient.addColorStop(1, 'rgb(155, 165, 185)');

        ctx.imageSmoothingEnabled = false;
        ctx.fillStyle = gradient;
        ctx.fillRect(2, 2, that.width - 4, that.height - 4);
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgb(0, 0, 0)';
        ctx.strokeRect(1, 1, that.width - 2, that.height - 2);
    };
}
function Menu(x, y, width) {

    var that    = new Frame(x, y, width, 4),
        entries = [];

    //Replace when we have real sub windows
    that.old_paint = that.paint;

    that.paint = function(ctx) {

        that.old_paint(ctx);

        entries.forEach(function(entry) {

            entry.paint(ctx);
        });
    };

    that.add_entry = function(entry) {
 
        //This is dumb, because this would already be taken
        //care of if we just made windows sub-instances of the
        //ui manager class already
        entries.push(entry);
        entry.parent = that;
        entry.x = 2;
        entry.y = (entries.length * 13) + 1;
        that.height += 14;
    };

    return that;
}
function MenuEntry(text, click_action) {

    var that = this;

    that.text = text;
    that.x = 0;
    that.y = 0;

    that.paint = function(ctx) {

        ctx.font = '12px sans-serif';
        ctx.fillStyle = 'rgb(0, 0, 0)';
        ctx.fillText(that.text, that.x, that.y);
    }

    that.onmousedown = function(x, y) {

        click_action();
    }
}
function UIManager() {

    var that = this;

    document.body.style.margin = "0px";
    that.canvas = document.createElement('canvas');
    that.context = that.canvas.getContext('2d');
    document.body.appendChild(that.canvas);

    window.addEventListener('resize', function(){
    
        that.do_resize();
    }, true);

    that.mouse_handler = function(e) {

        for(var i = that.children.length - 1; i > -1; i--) {
        
            var child = that.children[i];

            if(e.clientX >= child.x &&
               e.clientX < child.x + child.width &&
               e.clientY >= child.y &&
               e.clientY < child.y + child.height) {
                
                if(e.type === "mousemove") {
                
                    if(child.onmousemove)
                        child.onmousemove(e.clientX - child.x, e.clientY - child.y);

                    if(that.mouse_in_child !== child) {
                    
                        if(that.mouse_in_child && that.mouse_in_child.onmouseout)
                            that.mouse_in_child.onmouseout();

                        that.mouse_in_child = child;
                        
                        if(that.mouse_in_child.onmouseover)
                            that.mouse_in_child.onmouseover();
                    }
                }
 
                if(e.type === "mousedown") {
           
                    if(that.children[that.children.length - 1] !== child && child.suppress_raise !== true) {

                        //This needs to be genericized into a widget.raise method
                        that.children.splice(i, 1);
                        that.children.push(child);
                        that.paint_child(child);
                    }
                }

                if(child['on' + e.type])
                    child['on' + e.type](e.clientX - child.x, e.clientY - child.y);

                break;
            }
        };
    }

    that.canvas.onmousemove  = that.mouse_handler;
    that.canvas.onmousedown  = that.mouse_handler;
    that.canvas.onmouseup    = that.mouse_handler;
    that.canvas.onmouseclick = that.mouse_handler;

    that.children = [];

    that.do_resize = function() {

        that.canvas.width = window.innerWidth;
        that.canvas.height = window.innerHeight;
        
        that.children.forEach(function(child) {
        
            if(child.ongfxresize) 
                child.ongfxresize(that.canvas.width, that.canvas.height);

            child.invalidate();
        });
    };

    that.do_resize();

    that.mouse_in_child = null;

    that.children_below = function(child) {
    
        var return_group = [];
        var i = 0;

        //fast-forward to the selected child
        for(i = that.children.length - 1; i > -1; i--)
            if(that.children[i] === child)
                break;

        for(i--; i > -1; i--) {

            var target_widget = that.children[i];

            if(child.x <= (target_widget.x + target_widget.width) &&
               (child.x + child.width) >= target_widget.x &&
               child.y <= (target_widget.y + target_widget.height) &&
               (child.y + child.height) >= target_widget.y) 
                return_group.push(target_widget);
        }

        return return_group;
    }

    that.move_child = function(child, x, y) {

        that.children_below(child).forEach(function(target) {
            target.invalidate();
        });

        child.x = x;
        child.y = y;
        child.invalidate();
    }

    that.children_above = function(child) {

        var return_group = [];

        for(var i = that.children.length - 1; i > -1; i--) {

            if(that.children[i] === child)
                break;

            return_group.push(that.children[i]);
        }

        return return_group;
    }

    //Set up child context, do painting, reset context
    that.paint_child = function(child) {

        if(child.visible !== true)
            return;

        child.context.init_clip();
        that.context.save();
        child.context.apply_clip();

        if(child.paint)
            child.paint(that.context);

        that.context.restore();        
    }    

    //Fired when a child decalres that its content needs
    //to be redrawn. At the moment just calls the window
    //paint method, but should do some housekeeping things
    //in the future
    that.invalidate = function(child) {
    
        that.paint_child(child);
    }

    that.hide_child = function(child) {

        child.visible = false;
        
        that.children_below(child).forEach(function(target) {
 
            target.invalidate();
        });
    }

    that.destroy_child = function(child) {

        var i;
        
        for(i = 0; i < that.children.length; i++)
            if(that.children[i] === child)
                break;

        if(i == that.children.length)
            return;

        child.hide();
        that.children.splice(i, 1);
    }

    that.add_child = function(child) {

        child.visible = true;
        child.parent = that;
        that.children.push(child);  
        child.context = new DrawingContext(child);
        child.invalidate = function() { that.invalidate(child); };
        child.move = function(x, y) { that.move_child(child, x, y); };
        child.destroy = function(x, y) { that.destroy_child(child); };        
        child.hide = function() { that.hide_child(child); };

        that.paint_child(child);
    }
}

    
function Desktop(core) {

    var that = new Frame(0, 0, window.innerWidth, window.innerHeight),
        start_io = null;

    that.suppress_raise = true;
    that.bgcolor = 'rgb(90, 95, 210)';
    that.menu = null;

    that.ongfxresize = function(width, height) {

        that.width = width;
        that.height = height;
    };

    that.onmousedown = function(x, y) {

        if(that.menu) {

            that.menu.destroy();
            that.menu = null;
        } else {

            that.menu = new SessionMenu(core, x, y);
            that.parent.add_child(that.menu); //Should really add this as a child of Desktop when we've written the capacity for sub-windows (which is how we'll do actual widgets and such)
        }
    };

    that.paint = function(ctx) {

        ctx.fillStyle = that.bgcolor;
        ctx.fillRect(0, 0, that.width, that.height); 
        ctx.fillStyle = 'white';
        ctx.font = '12px sans-serif'; 
        ctx.fillText('PATCH Build Number ' + BUILDNO, 5, that.height - 6);

        //Set up wire stroke properties
        ctx.strokeWidth = '2px';
        ctx.strokeStyle = 'black';

        if(start_io) {

            ctx.beginPath();
            ctx.moveTo(start_io.x + start_io.parent_unit.x, start_io.y + start_io.parent_unit.y);
            ctx.lineTo(wire_x, wire_y);
            ctx.stroke();
        }

        var wires = core.get_wires();

        wires.forEach(function(wire) {

            ctx.beginPath();
            ctx.moveTo(wire.x1, wire.y1);
            ctx.lineTo(wire.x2, wire.y2);
            ctx.stroke();
        });
    };

    that.begin_connection = function(io) {
    
        start_io = io;
    };

    that.end_connection = function() {
    
        start_io = null;
    };

    that.onmousemove = function(x, y) {
    
        if(!start_io)
            return;

        wire_x = x;
        wire_y = y;
        that.invalidate();
    };

    return that;
}
function SessionMenu(patch, x, y) {

    var module_names = patch.list_modules();

    var that = new Menu(x, y, 200);

    module_names.forEach(function(name, i) {
    
        that.add_entry(new MenuEntry(name, function(){}));
    });

    that.onmousedown = function(x, y) {

        //Another fake until we have sub-widgets which would each handle their own clicking
        patch.instantiate_module(module_names[0]);
        that.destroy();
    };

    return that;
}
function Input(parent_unit, x, y) {
 
    var that = this;

    that.x = x;
    that.y = y;
    that.parent_unit = parent_unit;
}function PatchCore() {

    var that    = this,
        manager = null,
        modules = {},
        sources = [],
        desktop = null;

    that.install_module = function(module) {

        modules[module.name] = module.constructor;
    };

    that.next_spawn_x = function() {

        return 0;
    };

    that.next_spawn_y = function() {

        return 0;
    };

    that.start = function() {

        that.install_module(new Output()); //TODO: This will be replaced by the loading of default modules from a list
        manager = new UIManager();
        desktop = new Desktop(that);
        manager.add_child(desktop);
    };

    that.add_source = function(source) {

        sources.push(source);
    };   

    that.list_modules = function() {

        return Object.keys(modules);
    };

    that.begin_connection = function(io) {
    
        desktop.begin_connection(io);
    };

    that.get_wires = function() {

        return [];
    };

    that.instantiate_module = function(name) {

        //TODO: Make sure that passing a name that's not in
        //      the module list won't blow things up
        var mod = new modules[name](that);
        mod.x = that.next_spawn_x();
        mod.y = that.next_spawn_y();
        manager.add_child(mod);
    };
}
function Unit(patch) {

    var that = new Frame(0, 0, 100, 100);
    
    that.patch = patch;
    that.inputs = [];

    that.old_paint = that.paint;

    that.paint = function(ctx) {

        that.old_paint(ctx);

        ctx.strokeWidth = '2px';
        ctx.strokeStyle = 'black';

        that.inputs.forEach(function(input) {
 
            ctx.strokeRect(input.x - 2, input.y - 2, 4, 4);
        });
    };

    //Move to frame class
    that.resize = function(w, h) {

        that.width = w;
        that.height = h;
        if(that.invalidate) that.invalidate();
    };

    that.old_onmousedown = that.onmousedown;

    that.onmousedown = function(x, y) {

        var clicked = false;

        //This should be replaced when we have actual sub-windowing
        that.inputs.forEach(function(input) {
        
            if(clicked)
                return;

            if(x >= input.x - 2 &&
               x < input.x + 3 &&
               y >= input.y - 2 &&
               y < input.y + 3) {
 
                clicked = true;
                patch.begin_connection(input);
            }
        });

        if(clicked)
            return;

        that.old_onmousedown(x, y);
    }

    that.create_input = function(x, y) {

        var input = new Input(that, x, y);

        //Need to actually add a sub-widget to the frame
        that.inputs.push(input);        

        return input;
    };

    return that;
}
function Output() {

    this.name = 'Output';
    
    this.constructor = function(patch) {

        var that = new Unit(patch);

        that.resize(200, 150);

        var input = that.create_input(5, 75);

        patch.add_source(input);
 
        return that;
    }
}
new PatchCore().start();
