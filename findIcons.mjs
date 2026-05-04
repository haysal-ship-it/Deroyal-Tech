import * as icons from '@hugeicons/core-free-icons';
const keys = Object.keys(icons);
const needs = ["settings"];
const result = {};
needs.forEach(n => {
  result[n] = keys.filter(k => k.toLowerCase().startsWith(n) && k.endsWith('Icon')).slice(0, 5);
});
console.log(JSON.stringify(result, null, 2));
