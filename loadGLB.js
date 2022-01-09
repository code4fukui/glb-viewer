import { GLTFLoader } from 'https://cdn.skypack.dev/three@0.136.0/examples/jsm/loaders/GLTFLoader.js';

export const loadGLB = async (url) => {
  return new Promise((resolve) => {
    const loader = new GLTFLoader();
    loader.load(
      url,
      (gltf) => {
        resolve(gltf.scene);
      },
      (err) => {
        if (!err instanceof ProgressEvent) {
          console.error(err);
        }
      }
    );
  });
};
