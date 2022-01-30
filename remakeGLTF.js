import { Base64 } from "https://code4fukui.github.io/Base64/Base64.js";

const fn = Deno.args[0];
const imgfn = Deno.args[1];
if (!fn) {
  console.log("reamkeGLTF [gltf fn] [image fn]");
  Deno.exit(1);
}
const data = JSON.parse(await Deno.readTextFile(fn));
const hex = data.buffers[0].uri;
//console.log(hex);
const bin = Base64.decode(hex.substring("data:application/octet-stream;base64,".length));

if (data.images.length != 1) {
  console.log("sorry, images count must be 1.");
  Deno.exit(1);
}
let nimg = data.images[0].bufferView;
const jpgbin = new Uint8Array(await Deno.readFile(imgfn));

const bimg = data.bufferViews[nimg];
const dlen = bimg.byteLength - jpgbin.length;
console.log("reduce size " + dlen);

const newbuf = new Uint8Array(bin.length - dlen);
for (let i = 0; i < bimg.byteOffset; i++) {
  newbuf[i] = bin[i];
}
for (let i = 0; i < jpgbin.length; i++) {
  newbuf[i + bimg.byteOffset] = jpgbin[i];
}
for (let i = bimg.byteOffset + bimg.byteLength; i < bin.length; i++) {
  newbuf[i + bimg.byteOffset + jpgbin.length] = bin[i];
}
bimg.byteLength = jpgbin.length;
for (let i = bimg + 1; i < data.bufferViews.length; i++) {
  data.bufferViews[i].byteOffset -= dlen;
}

data.buffers[0].uri = "data:application/octet-stream;base64," + Base64.encode(newbuf);
await Deno.writeTextFile(fn.substring(0, fn.length - 5) + "-new.gltf", JSON.stringify(data, null, 2));
