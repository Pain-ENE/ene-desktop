const { app, nativeImage, screen } = require('electron');
const path = require('node:path');
app.whenReady().then(() => {
  const image = nativeImage.createFromPath(path.resolve(__dirname, '../public/assets/ene-idle.png'));
  const result = { displays: screen.getAllDisplays().map(d => ({ scale: d.scaleFactor, bounds: d.bounds })), cases: [] };
  for (const [width, height] of [[320,482],[320,480],[260,392]]) {
    const resized = image.resize({ width, height });
    result.cases.push({ requested: {width,height}, size: resized.getSize(), factors: resized.getScaleFactors(), bytes: resized.toBitmap().length, explicit1: resized.toBitmap({scaleFactor:1}).length, expected: width*height*4 });
  }
  console.log(JSON.stringify(result,null,2)); app.quit();
});
