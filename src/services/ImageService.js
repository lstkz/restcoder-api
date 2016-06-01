"use strict";

const Jimp = require('jimp');
const Joi = require('joi');

//Exports
module.exports = {
  resizeImage
};


function* resizeImage(data) {
  let image = yield Jimp.read(data.path);

  const w = image.bitmap.width;
  const h = image.bitmap.height;
  const origRatio = w/h;
  let desiredRatio = data.width/data.height;
  let x = 0;
  let y = 0;

  if (origRatio !== desiredRatio) {
    if (desiredRatio > origRatio) {
      desiredRatio = 1/desiredRatio;
    }
    if (origRatio >= 1) {
      y = 0;	// height is the smaller dimension here
      x = Math.floor((w/2) - (h * desiredRatio / 2));
      image.crop(x, y, h * desiredRatio, h);
    } else {
      x = 0;	// width is the smaller dimension here
      y = Math.floor(h/2 - (w * desiredRatio / 2));
      image.crop(x, y, w, w * desiredRatio);
    }
  }

  if (w > data.width || h > data.height) {
    image.resize(data.width || Jimp.AUTO, data.height || Jimp.AUTO);
  }

  yield (cb) => image.write(data.target || data.path, cb);
}

resizeImage.schema = {
  data: {
    path: Joi.string().required(),
    target: Joi.string(),
    width: Joi.number().required(),
    height: Joi.number().required()
  }
};
