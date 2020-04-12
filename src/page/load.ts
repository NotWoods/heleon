/**
 * Contains construstors and helper functions.  Avoids using the DOM for functions.
 * @author       Tiger Oakes <tigeroakes@gmail.com>
 * @copyright    2014 Tiger Oakes
 */

import pathPrefix from 'consts:pathPrefix';
import { GTFSData, Trip } from '../gtfs-types';
import { toInt } from './utils/num';
import { createLink, Type, Linkable } from './utils/link';
import { store } from './state/store';

export const updateEvent = new CustomEvent('pageupdate');

navigator.serviceWorker?.register(pathPrefix + 'service-worker.js');

const PIN_URL = pathPrefix + 'assets/pins.png';

export const normal = {
    url: PIN_URL,
    size: { height: 26, width: 24 },
    scaledSize: { height: 26, width: 120 },
    origin: { x: 0, y: 0 },
    anchor: { x: 12, y: 12 },
  } as google.maps.Icon,
  unimportant = {
    url: PIN_URL,
    size: { height: 26, width: 24 },
    scaledSize: { height: 26, width: 120 },
    origin: { x: 96, y: 0 },
    anchor: { x: 12, y: 12 },
  } as google.maps.Icon,
  userShape = {
    url: PIN_URL,
    size: { height: 26, width: 24 },
    scaledSize: { height: 26, width: 120 },
    origin: { x: 48, y: 0 },
    anchor: { x: 12, y: 12 },
  } as google.maps.Icon,
  placeShape = {
    url: PIN_URL,
    size: { height: 26, width: 24 },
    scaledSize: { height: 26, width: 120 },
    origin: { x: 72, y: 0 },
    anchor: { x: 12, y: 23 },
  } as google.maps.Icon,
  stopShape = {
    url: PIN_URL,
    size: { height: 26, width: 24 },
    scaledSize: { height: 26, width: 120 },
    origin: { x: 24, y: 0 },
    anchor: { x: 12, y: 20 },
  } as google.maps.Icon;

/**
 * Grabs the API data and parses it into a GTFSData object for the rest of the program.
 */
export function getScheduleData(): Promise<GTFSData> {
  return fetch(pathPrefix + 'api.json')
    .then(res => {
      if (res.ok) return res.json();
      throw new Error(res.statusText);
    })
    .then(json => json as GTFSData);
}

export function createElement<Tag extends keyof HTMLElementTagNameMap>(
  type: Tag,
  props: Partial<HTMLElementTagNameMap[Tag]>,
) {
  return Object.assign(document.createElement(type), props);
}

/**
 * Creates a promise version of the document load event
 * @return {Promise<DocumentReadyState>} resolves if document has loaded
 */
export function documentLoad() {
  if (
    document.readyState === 'interactive' ||
    document.readyState === 'complete'
  ) {
    return Promise.resolve(document.readyState);
  }

  return new Promise(resolve => {
    document.addEventListener('readystatechange', () => {
      if (document.readyState === 'interactive') {
        resolve(document.readyState);
      }
    });
  });
}

/**
 * Generates a link for href values. Meant to maintain whatever active data is avaliable.
 * @param {Type} type  		Type of item to change
 * @param {string} value 	ID to change
 * @return {string} URL to use for href, based on active object.
 */
function pageLink(type: Type, value: string) {
  return createLink(type, value, store.getState());
}

type DynamicLinkNode = HTMLAnchorElement & Linkable;

/**
 * Converts an A element into an automatically updating link.
 * @param  {Type} type      What value to change in link
 * @param  {string} value   Value to use
 * @param  {boolean} update Wheter or not to listen for "pageupdate" event and update href
 * @return {Node}           A element with custom properties
 */
export function convertToLinkable(
  node: HTMLAnchorElement,
  type: Type,
  value: string,
  update?: boolean,
) {
  Object.assign(node, {
    Type: type,
    Value: value,
    href: pageLink(type, value),
  });
  node.href = pageLink(type, value);
  node.addEventListener('click', clickEvent);
  if (update) {
    node.addEventListener('pageupdate', function() {
      node.href = pageLink(type, value);
    });
  }

  return node;
}

/**
 * Creates an A element with custom click events for links.  Can update itself.
 * @param  {Type} type      What value to change in link
 * @param  {string} value   Value to use
 * @param  {boolean} update Wheter or not to listen for "pageupdate" event and update href
 * @return {Node}           A element with custom properties
 */
export function dynamicLinkNode(type: Type, value: string, update?: boolean) {
  const node = document.createElement('a') as DynamicLinkNode;
  return convertToLinkable(node, type, value, update);
}

/**
 * Navigate to the page described by the `Linkable`.
 */
export function openLinkable(link: Linkable) {
  const { route } = store.getState();
  const val = link.Value;
  const newLink = pageLink(link.Type, val);
  switch (link.Type) {
    case Type.ROUTE:
      store.setState({ route: { id: val, trip: route.trip } })
      break;
    case Type.STOP:
      store.setState({ stop: val, focus: 'stop' })
      break;
    case Type.TRIP:
      store.setState({ route: { trip: val, id: route.id } })
      break;
  }
  history.pushState(store.getState(), null as any, newLink);
  ga?.('send', 'pageview', { page: newLink, title: document.title });
}

/**
 * Used for the click event of a dynamicLinkNode
 * @param  {Event} e
 */
export function clickEvent(this: Linkable, e: Event) {
  e.preventDefault?.();
  e.stopPropagation?.();
  openLinkable(this);
  return false;
}

/**
 * Sorts stop time keys
 * @param {GTFSData stop_times} stopTimes
 * @return ordered list
 */
export function sequence(stopTimes: Trip['stop_times']): string[] {
  const stopSequence = [];
  for (const key in stopTimes) {
    stopSequence.push(key);
  }
  return stopSequence.sort((a, b) => toInt(a) - toInt(b));
}
