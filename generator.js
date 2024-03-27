let canvas;

document.addEventListener('DOMContentLoaded', () => {
  initialize();
});

function initialize() {
  canvas = document.getElementById('my-canvas');

  window.addEventListener('resize', () => draw(), false);
  draw();
}

function draw(width = window.innerWidth, height = window.innerHeight) {
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, width, height);

  ctx.fillStyle = 'lightgreen';
  ctx.strokeStyle = 'black';
  ctx.fillRect(0, 0, width, height);
  ctx.save();

  ctx.ellipse(
    width / 2,
    height / 2,
    width / 6,
    width / 8,
    Math.PI / 4,
    0,
    2 * Math.PI
  );
  ctx.fillStyle = 'lightblue';
  ctx.fill();
  ctx.stroke();

  // here's how the artist must trigger the capture, it will use the `default` exporter with the provided resolution
  $objkt.capture();
}

function exportCanvas(mime) {
  return async ({ resolution: { x: x, y: y } }) => {
    draw(x, y);
    const blob = await new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), mime);
    });
    draw();

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  };
}

$objkt.registerExport(
  { mime: 'image/png', resolution: { x: 1024, y: 1024 }, default: true },
  exportCanvas('image/png')
);
$objkt.registerExport(
  {
    mime: 'image/jpeg',
    resolution: { x: 600, y: 400 },
    aspectRatio: 3 / 2,
  },
  exportCanvas('image/jpeg')
);
