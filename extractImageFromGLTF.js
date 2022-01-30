import { Base64 } from "https://code4fukui.github.io/Base64/Base64.js";

const fn = Deno.args[0];
if (!fn) {
  console.log("extractImageFromGLTF [gltf fn]");
  Deno.exit(1);
}
const data = JSON.parse(await Deno.readTextFile(fn));
const hex = data.buffers[0].uri;
//console.log(hex);
const bin = Base64.decode(hex.substring("data:application/octet-stream;base64,".length));
//console.log(bin.length);
for (const img of data.images) {
  const name = img.name;
  const jbuf = data.bufferViews[img.bufferView];
  const jpgbin = new Uint8Array(jbuf.byteLength);
  for (let i = 0; i < jpgbin.length; i++) {
    jpgbin[i] = bin[i + jbuf.byteOffset];
  }
  await Deno.writeFile(fn + "." + name, jpgbin);
}
