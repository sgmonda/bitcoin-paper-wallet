const bitcoin = require('bitcoinjs-lib');
const qrcode = require('qrcode')
const fs = require('fs');
const { createCanvas, loadImage, Image } = require('canvas')

const PRIVATE_QR_POSITION = [400, 250];
const PUBLIC_QR_POSITION = [4470, 250];
const PRIVATE_KEY_POSITION = [200, 800];
const PUBLIC_KEY_POSITION = [4400, 800];
const KEY_FONT_SIZE = 60;
const QR_SIZE = 500;

function writeFile (path, data, encoding) {
  return new Promise((resolve, reject) => {
    const callback = (error, value) => error ? reject(error) : resolve(value);
    fs.writeFile(path, data, encoding, callback);
  });
}

function createQr (data) {
  return new Promise((resolve, reject) => {
    const callback = (error, value) => error ? reject(error) : resolve(value);
    qrcode.toDataURL(data, {scale: 50}, callback);
  });
}

function createImage (path) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = (error) => reject(error);
    image.src = path;
  });
}

async function run () {
  const keyPair = bitcoin.ECPair.makeRandom()
  const public = {key: keyPair.getAddress(), qr: null, image: null};
  const private = {key: keyPair.toWIF(), qr: null, image: null};
  const dir = `wallet_${public.key}`;

  public.qr = await createQr(public.key);
  private.qr = await createQr(private.key);
  public.image = await createImage(public.qr);
  private.image = await createImage(private.qr);

  const background = await createImage ('./template.png');
  const canvas = createCanvas(background.width, background.height);
  const ctx = canvas.getContext('2d');

  ctx.drawImage(background, 0, 0, background.width, background.height);
  ctx.drawImage(public.image, PUBLIC_QR_POSITION[0], PUBLIC_QR_POSITION[1], QR_SIZE, QR_SIZE);
  ctx.drawImage(private.image, PRIVATE_QR_POSITION[0], PRIVATE_QR_POSITION[1], QR_SIZE, QR_SIZE);
  ctx.font = `${KEY_FONT_SIZE}px monospace`;

  let middle = parseInt(private.key.length / 2);
  ctx.fillText(private.key.substring(0, middle), PRIVATE_KEY_POSITION[0], PRIVATE_KEY_POSITION[1]);
  ctx.fillText(private.key.substring(middle), PRIVATE_KEY_POSITION[0], PRIVATE_KEY_POSITION[1] + KEY_FONT_SIZE);

  middle = parseInt(public.key.length / 2);
  ctx.fillText(public.key.substring(0, middle), PUBLIC_KEY_POSITION[0], PUBLIC_KEY_POSITION[1]);
  ctx.fillText(public.key.substring(middle), PUBLIC_KEY_POSITION[0], PUBLIC_KEY_POSITION[1] + KEY_FONT_SIZE);

  fs.mkdirSync(dir);
  fs.writeFileSync(`${dir}/public.txt`, public.key);
  fs.writeFileSync(`${dir}/private.txt`, private.key);

  var base64Data = canvas.toDataURL().replace(/^data:image\/png;base64,/, "");
  await writeFile (`${dir}/wallet.png`, base64Data, 'base64');

  console.log(`Wallet created: ${dir}`)
}

run().then(() => {
  process.exit(SUCCESS = 0);
}).catch((error) => {
  console.warn('FAILURE', error);
  process.exit(FAILURE = 1);
});