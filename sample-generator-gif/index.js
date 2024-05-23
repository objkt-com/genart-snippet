let canvas;
let ctx;
let colors;
let timeout;
let requestId;
let i = 0;

document.addEventListener('DOMContentLoaded', () => {
  initialize();
});

function cancel() {
  if (timeout) clearTimeout(timeout);
  if (requestId) cancelAnimationFrame(requestId);
}
async function initialize() {
  canvas = document.getElementById('my-canvas');
  window.addEventListener(
    'resize',
    () => {
      cancel();
      draw();
    },
    false
  );

  var query = new URLSearchParams(window.location.search);
  if (query.has('sleep')) {
    await new Promise((resolve) => setTimeout(resolve, parseInt(query.get('sleep') * 1000, 10)));
  }
  draw();
}

function drawFrame(angle, width, height) {
  // ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = colors.bgFill;
  ctx.fillRect(0, 0, width, height);
  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.rotate((angle * Math.PI) / 180);
  ctx.fillStyle = colors.objectFill;
  ctx.fillRect(-width / 20, -width / 20, width / 10, width / 10);
  ctx.restore();
}

function draw(width = window.innerWidth, height = window.innerHeight) {
  $o.rnd(null);

  canvas.width = width;
  canvas.height = height;

  ctx = ctx || canvas.getContext('2d');

  // console.log(`?seed=${$o.seed.toString(16)}`);
  colors = colors || {
    bgFill: '#' + $o.seed.toString(16).substring(0, 6),
    objectFill: '#' + $o.seed.toString(16).substring(2, 8),
  };

  drawFrame(i * 10, canvas.width, canvas.height);
  // here's how the artist must trigger the capture, it will use the `default` exporter with the provided resolution
  $o.capture();

  i = (i + 1) % 36;
  timeout = setTimeout(() => {
    requestId = requestAnimationFrame(() => draw(canvas.width, canvas.height));
  }, 20);
}

function exportCanvas(mime) {
  return async ({ resolution: { x: x, y: y } }) => {
    draw(x, y);
    const blob = await new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), mime);
    });

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  };
}

async function createGif({ resolution: { x: x, y: y } }) {
  return new Promise((resolve) => {
    const gif = new GIF({
      workers: 2,
      quality: 10,
    });
    cancel();
    canvas.width = x;
    canvas.height = y;
    for (let i = 0; i < 36; i++) {
      // 36 frames for a full rotation
      drawFrame(i * 10, x, y); // Increment angle by 10 degrees
      gif.addFrame(canvas, { copy: true, delay: 50 });
    }

    gif.on('finished', (blob) => {
      resolve(blob);
    });

    gif.render();
  }).then((blob) => {
    return new Promise((resolve) => {
      cancel();
      draw();
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  });
}

$o.registerExport(
  {
    default: true,
    mime: 'image/jpeg',
    resolution: { x: 900, y: 600 },
  },
  exportCanvas('image/jpeg')
);

$o.registerExport({ mime: 'image/gif', resolution: { x: 400, y: 400 }, thumb: true }, createGif);
