!function(){"use strict";var e="/big-island-buses/";function t(e,t){for(var o in t)e[o]=t[o];return e}const o=function(e){var o=[];function n(e){for(var t=[],n=0;n<o.length;n++)o[n]===e?e=null:t.push(o[n]);o=t}function s(n,s,i){e=s?n:t(t({},e),n);for(var r=o,a=0;a<r.length;a++)r[a](e,i)}return e=e||{},{action:function(t){function o(e){s(e,!1,t)}return function(){for(var n=arguments,s=[e],i=0;i<arguments.length;i++)s.push(n[i]);var r=t.apply(this,s);if(null!=r)return r.then?r.then(o):o(r)}},setState:s,subscribe:function(e){return o.push(e),function(){n(e)}},unsubscribe:n,getState:function(){return e}}}({route:{},view:{route:0,stop:1},locatePermission:-1,focus:"stop"});function n(e){let t,o;return function(...n){return(null==t?void 0:t.every(((e,t)=>e===n[t])))||(t=n,o=e(...n)),o}}function s(e,t){return e===t}function i(e,t){const o=Object.keys(e),n=Object.keys(t);return o.length===n.length&&o.every((o=>e[o]===t[o]))}function r(e){const t=Object.keys(e);return Promise.all(t.map((t=>e[t]))).then((e=>{const o={};return t.forEach(((t,n)=>{o[t]=e[n]})),o}))}function a(e,t,o,n){let s;function i(e){return Promise.resolve(t(e)).then((e=>{s&&o(s,e)||(s=e,n(e))}))}return i(e.getState()),e.subscribe(i)}function c(e){return{route:e.route,stop:e.stop}}function l(t,o,n){let s=e;switch(t){case"route":s+=`routes/${o}/`,null!=n.route.trip&&(s+=n.route.trip),null!=n.stop&&(s+="?stop="+n.stop);break;case"stop":return"?stop="+o;case"trip":s+=`routes/${n.route.id}/${o}`,null!=n.stop&&(s+="?stop="+n.stop);break;default:console.warn("Invalid type provided for link: %i",t)}return s}function u(e,t){const o=e.indexOf(t);return o>-1?e.substring(o+t.length):null}const d=new RegExp(e+"routes/([\\w-]+)/(\\w+)?");function p(e){var t;const o=u(e.hash,"#!")||(null===(t=u(e.search,"_escaped_fragment_"))||void 0===t?void 0:t.replace(/%26/g,"&"));if(o){const e=new URLSearchParams(o);return{route:{id:e.get("route"),trip:e.get("trip")},stop:e.get("stop")}}const n=e.pathname.match(d),s=e.searchParams.get("stop");if(n){const[,e,t]=n;return{route:{id:e,trip:t},stop:s}}return{route:{},stop:s}}var g;null===(g=navigator.serviceWorker)||void 0===g||g.register(e+"service-worker.js");const m=e+"assets/pins.png",h={url:m,size:{height:26,width:24},scaledSize:{height:26,width:120},origin:{x:0,y:0},anchor:{x:12,y:12}},f={url:m,size:{height:26,width:24},scaledSize:{height:26,width:120},origin:{x:96,y:0},anchor:{x:12,y:12}},v={url:m,size:{height:26,width:24},scaledSize:{height:26,width:120},origin:{x:48,y:0},anchor:{x:12,y:12}},y={url:m,size:{height:26,width:24},scaledSize:{height:26,width:120},origin:{x:72,y:0},anchor:{x:12,y:23}},w={url:m,size:{height:26,width:24},scaledSize:{height:26,width:120},origin:{x:24,y:0},anchor:{x:12,y:20}};function _(e,t){return Object.assign(document.createElement(e),t)}function I(e,t){return l(e,t,o.getState())}function E(e,t,o,n){return Object.assign(e,{Type:t,Value:o,href:I(t,o)}),e.href=I(t,o),e.addEventListener("click",P),n&&a(n,c,i,(n=>{e.href=l(t,o,n)})),e}function C(e,t,o){return E(document.createElement("a"),e,t,o)}function L(e){const{Type:t,Value:n}=e,s=I(t,n),i=function(e,t,o){const n=c(e);switch(t){case"stop":n.stop=o;break;case"route":n.route={id:o,trip:e.route.trip};break;case"trip":n.route={id:e.route.id,trip:o}}return n}(o.getState(),t,n);"stop"===t&&(i.focus="stop"),o.setState(i),history.pushState(i,"",s),null===ga||void 0===ga||ga("send","pageview",{page:s,title:document.title})}function P(e){var t,o;return null===(t=e.preventDefault)||void 0===t||t.call(e),null===(o=e.stopPropagation)||void 0===o||o.call(e),L(this),!1}function B(e){let t;return(o,n,s)=>(t||(t=new google.maps.Marker(e),t.setMap(o),t.Type="stop",google.maps.event.addListener(t,"click",P)),t.Value=s,t.setPosition(n),t)}let b=0;class S{constructor(e){this.worker=e,this.callbacks=new Map,e.addEventListener("message",(e=>this.onMessage(e.data)))}onMessage(e){if(!Array.isArray(e)||e.length<2)return;const[t,o,n]=e,s=this.callbacks.get(t);s&&(this.callbacks.delete(t),s(o,n))}postMessage(e){const t=b++,o=[t,e];return new Promise(((e,n)=>{this.callbacks.set(t,((t,o)=>{t?n(t):e(o)})),this.worker.postMessage(o)}))}}const x=new S(new Worker(e+"worker/closest-stop.js"));let k=!1;function M(e,t){return t?(k||(x.postMessage({stops:Object.values(e)}),k=!0),x.postMessage(t)):Promise.resolve(void 0)}const O=n(M),T=n(M);function z(e,t){return O(e,t.userLocation)}function R(e,t){return T(e,t.searchLocation)}function j(e){return null==e?void 0:e.stop_id}function N(e,t){return Promise.resolve().then((()=>{switch(t.focus){case"user":return z(e,t).then(j);case"search":return R(e,t).then(j);case"stop":return t.stop||void 0}}))}let V=0;const $={[-1]:"Find routes near my location >",0:"",1:"Location permission denied.",2:"Location search failed.",3:"Location search timed out."};const A=e=>Number.parseInt(e,10);function D(e){if("string"==typeof e&&e.indexOf(":")>-1&&e.lastIndexOf(":")>e.indexOf(":")){const[t,o,n]=e.split(":").map(A);e=new Date(0,0,0,t,o,n,0)}if("object"!=typeof e)throw new TypeError("date must be Date or string, not "+typeof e);let t="am",o="",n="";const s=e.getHours(),i=e.getMinutes();if(0===s)o="12";else if(12===s)o="12",t="pm";else if(s>12){o=(s-12).toString(),t="pm"}else o=s.toString();return n=0===i?"":i<10?":0"+i.toString():":"+i.toString(),o+n+t}function G(e){return D(function(e){const[t,o,n]=e.split(":").map((e=>A(e)));let s=0,i=0;return t>23&&(s=Math.floor(t/24),i=t%24),new Date(0,0,0+s,t+i,o,n,0)}(e))}const H=new S(new Worker(e+"worker/route-details.js"));let Z,W,U,q,F,J=[];const K="interactive"===document.readyState||"complete"===document.readyState?Promise.resolve(document.readyState):new Promise((e=>{document.addEventListener("readystatechange",(()=>{"interactive"===document.readyState&&e(document.readyState)}))})),Q=fetch(e+"api.json").then((e=>{if(e.ok)return e.json();throw new Error(e.statusText)})).then((e=>e)),X=function(){if(!navigator.onLine||"object"!=typeof google||"object"!=typeof google.maps)throw K.then((function(){document.body.classList.add("no-map")})),new Error("Google Maps API has not loaded");q=new google.maps.LatLngBounds,J=[];const e=K.then((function(){return Promise.resolve().then((()=>{const e=o.getState().view.stop,t=1===e?document.getElementById("map-canvas"):document.getElementById("streetview-canvas"),n=2===e?document.getElementById("map-canvas"):document.getElementById("streetview-canvas");return Z=new google.maps.Map(t,{center:new google.maps.LatLng(19.6,-155.56),zoom:10,mapTypeControlOptions:{position:google.maps.ControlPosition.TOP_CENTER},panControlOptions:{position:google.maps.ControlPosition.RIGHT_TOP},streetViewControlOptions:{position:google.maps.ControlPosition.RIGHT_TOP},zoomControlOptions:{position:google.maps.ControlPosition.RIGHT_TOP}}),W=new google.maps.StreetViewPanorama(n,{position:new google.maps.LatLng(19.723835,-155.084741),visible:!0,pov:{heading:34,pitch:0},scrollwheel:!1,panControlOptions:{position:google.maps.ControlPosition.RIGHT_CENTER},zoomControlOptions:{style:google.maps.ZoomControlStyle.SMALL,position:google.maps.ControlPosition.RIGHT_CENTER},addressControl:!1}),Z.setStreetView(W),U=new google.maps.places.Autocomplete(document.getElementById("search")),U.bindTo("bounds",Z),google.maps.event.addListener(U,"place_changed",(function(){const e=U.getPlace();e.geometry&&o.setState({searchLocation:e.geometry.location.toJSON(),focus:"search"})})),Z}))}));return Promise.all([e,Q.then((function(e){return Promise.resolve().then((()=>{for(const t of Object.values(e.stops)){const e=new google.maps.Marker({position:t.position,title:t.stop_name,icon:h});e.Type="stop",e.Value=t.stop_id,e.stop_id=t.stop_id,google.maps.event.addListener(e,"click",P),q.extend(e.getPosition()),J.push(e)}return{markers:J,bounds:q}}))}))]).then((function([e,{markers:t,bounds:o}]){e.setCenter(o.getCenter()),e.fitBounds(o),google.maps.event.addListener(e,"bounds_changed",(function(){const o=e.getBounds();for(const n of t)o.contains(n.getPosition())?n.getMap()!==e&&n.setMap(e):n.setMap(null)})),t.forEach((t=>t.setMap(e)))})),window.addEventListener("resize",(function(){google.maps.event.trigger(Z,"resize"),google.maps.event.trigger(W,"resize"),o.getState().route.id||(Z.setCenter(q.getCenter()),Z.fitBounds(q))})),e}();if(Q.then((e=>{window.api=e,window.store=o})),Promise.all([Q,X]).then((([e,t])=>{function n({location:e,stop:o,buildMarker:n}){e&&n(t,e,null==o?void 0:o.stop_id)}const s=B({title:"My Location",icon:v,animation:google.maps.Animation.DROP,zIndex:1e3}),c=B({title:"Search Location",icon:y,animation:google.maps.Animation.DROP,zIndex:1e3});a(o,(t=>r({location:t.userLocation,stop:z(e.stops,t),buildMarker:s})),i,n),a(o,(t=>r({location:t.searchLocation,stop:R(e.stops,t),buildMarker:c})),i,n)})),Promise.all([Q,K.then((function(){const e=document.getElementById("nearby"),t=document.getElementById("other"),n=document.getElementById("nearby-info"),i=new Map;for(const e of t.children){const t=e,n=t.dataset.route;E(t.querySelector("a.routes__link"),"route",n,o),i.set(n,t)}return function(o,r){n.addEventListener("click",(()=>{n.textContent="Loading...",n.hidden=!1,function(e){let t=!0;navigator.geolocation.clearWatch(V),V=navigator.geolocation.watchPosition((function({coords:o}){let n={locatePermission:0,userLocation:{lat:o.latitude,lng:o.longitude}};t&&(n.focus="user",t=!1),e.setState(n)}),(function(t){e.setState({locatePermission:t.code})}))}(r)})),a(r,(e=>e.locatePermission),s,(function(e){const t=$[e];n.textContent=t,n.hidden=!t})),a(r,(e=>z(o.stops,e)),s,(function(o){const n=new Set(null==o?void 0:o.routes);for(const[o,s]of i)n.has(o)?e.appendChild(s):t.appendChild(s)}))}}))]).then((([e,t])=>t(e,o))),K.then((function(){!function(){navigator.onLine||document.getElementById("main").classList.add("offline");document.getElementById("map-toggle").addEventListener("click",ee);const e=document.getElementById("trip-select");function t(){document.getElementById("aside").classList.toggle("open")}e.Type="trip",e.addEventListener("change",(function(t){e.Value=e.options[e.selectedIndex].value,P.call(e,t)})),document.getElementById("screen-cover").addEventListener("click",t),document.getElementById("menu").addEventListener("click",t),document.getElementById("alt-menu").addEventListener("click",t)}()})),Q.then((e=>{a(o,(t=>r({route_id:t.route.id||void 0,trip_id:t.route.trip||void 0,stop_id:N(e.stops,t)})),i,(function(t){let o=Promise.resolve();return t.route_id&&(o=te(e,t.route_id).then((o=>{var n;return function(e,t,o){const n=e.routes[t];if(!n)return void console.error("Invalid Route %s",t);const s=n.trips[o];if(!s||!s.trip_id)return void console.error("Invalid trip %s in route %s",o,t);const i=document.getElementById("schedule");Y(i);const r=document.getElementById("trip-select");for(let e=0;e<r.options.length;e++)if(r.options[e].value===o){r.selectedIndex=e,r.options[e].selected=!0;break}document.getElementById("week-days-value").textContent=e.calendar[s.service_id].text_name;for(const t of s.stop_times){const o=C("stop",t.stop_id);o.className="schedule__stop";const n=_("div",{className:"lines"});for(let e=0;e<2;e++){const e=_("span",{className:"line"});n.appendChild(e)}o.appendChild(n);const s=_("span",{className:"schedule__stopname name",textContent:e.stops[t.stop_id].stop_name});o.appendChild(s);const r=_("time",{className:"schedule__time",textContent:G(t.arrival_time)});o.appendChild(r),i.appendChild(o)}}(e,t.route_id,null!==(n=t.trip_id)&&void 0!==n?n:o)}))),t.stop_id&&function(e,t,o){const n=e.stops[o];if(!n||!n.stop_id)return void console.error("Invalid Stop %s",o);W&&W.setPosition(n.position);if(Z){for(const e of J)e.activeInRoute||null==t?e.setIcon(h):e.setIcon(f),e.stop_id===n.stop_id&&(F=e);F.setIcon(w),F.setZIndex(300),W.setPosition(F.getPosition()),google.maps.event.trigger(W,"resize"),google.maps.event.addListener(W,"pano_changed",(function(){document.getElementById("address").textContent=W.getLocation().description,W.setPov(W.getPhotographerPov())}))}W||document.getElementById("stop").classList.add("no-streetview");document.getElementById("stop_name").textContent=n.stop_name;const s=document.getElementById("connections");Y(s);for(const o of n.routes){const n=e.routes[o],i=C("route",o);i.className="connections__link",i.style.borderColor="#"+n.route_color,i.textContent=n.route_long_name;const r=document.createElement("li");r.className="connections__item",r.append(i),t===o&&r.classList.add("connections__item--active-route"),s.append(r)}document.getElementById("main").classList.add("open-stop")}(e,t.route_id,t.stop_id),o}))})),window.history.state)o.setState(window.history.state);else{const e=p(new URL(location.href));o.setState(e)}function Y(e){for(;e.firstChild;)e.removeChild(e.firstChild)}function ee(){if(!Z||!W)throw console.error("Map and StreetViewPanorama have not loaded"),new TypeError;const e=document.getElementById("map"),t=document.getElementById("streetview-header"),n={...o.getState().view};1===n.stop?(e.insertBefore(document.getElementById("streetview-canvas"),e.firstChild),t.insertBefore(document.getElementById("map-canvas"),e.firstChild),this.classList.add("on"),n.stop=2):2===n.stop&&(e.insertBefore(document.getElementById("map-canvas"),e.firstChild),t.insertBefore(document.getElementById("streetview-canvas"),e.firstChild),this.classList.remove("on"),n.stop=1),o.setState({view:n})}window.onhashchange=()=>{const e=p(new URL(location.href));o.setState(e)},window.onpopstate=e=>{o.setState(e.state)};const te=n((function(e,t){const o=e.routes[t];if(!o||!o.route_id)return console.error("Invalid Route %s",t),Promise.resolve(void 0);const n=function(e){const t=Object.values(e.trips);return H.postMessage(t)}(o);document.title=o.route_long_name+" | Big Island Buses";const s=document.getElementById("content");s.style.setProperty("--route-color","#"+o.route_color),s.style.setProperty("--route-text-color","#"+o.route_text_color);document.getElementById("route_long_name").textContent=o.route_long_name;const i=document.getElementById("trip-select");Y(i);for(const e of Object.values(o.trips)){const t=_("option",{value:e.trip_id,textContent:e.trip_short_name});i.appendChild(t)}return n.then((t=>{function o(t){return e.stops[t].stop_name}const n=1!==t.closestTrip.minutes?t.closestTrip.minutes+" minutes":"1 minute";if(document.getElementById("place-value").textContent=`Between ${o(t.firstStop)} - ${o(t.lastStop)}`,document.getElementById("time-value").textContent=`${D(t.earliest)} - ${D(t.latest)}`,document.getElementById("next-stop-value").textContent=`Reaches ${o(t.closestTrip.stop)} in ${n}`,document.getElementById("main").classList.add("open"),Z){const e=new google.maps.LatLngBounds;for(const o of J)t.stops.has(o.stop_id)?(o.setIcon(h),o.setZIndex(200),o.activeInRoute=!0,e.extend(o.getPosition())):(o.setIcon(f),o.setZIndex(null),o.activeInRoute=!1);F&&(F.setIcon(w),F.setZIndex(300)),google.maps.event.trigger(Z,"resize"),Z.setCenter(e.getCenter()),Z.fitBounds(e),google.maps.event.trigger(W,"resize")}return t.closestTrip.id}))}))}();
//# sourceMappingURL=main.js.map
