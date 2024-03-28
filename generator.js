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

  console.log(`?seed=${$objkt.seed.toString(16)}`);
  const colors = {
    bgFill: $objkt.seed.toString(16).substring(0, 6),
    ellipseFill: $objkt.seed.toString(16).substring(1, 7),
  };

  ctx.fillStyle = '#' + colors.bgFill;
  ctx.strokeStyle = 'black';
  ctx.fillRect(0, 0, width, height);
  ctx.save();

  const ellipseWidth = $objkt.rnd() * 4 + 3;
  const ellipseHeight = $objkt.rnd() * 6 + 3;

  $objkt.registerFeatures({
    background: colorFeatures(colors.bgFill),
    object: colorFeatures(colors.ellipseFill),
  });

  ctx.ellipse(
    width / 2,
    height / 2,
    width / ellipseWidth,
    height / ellipseHeight,
    Math.PI / (($objkt.seed % 2) + 1) / 2,
    0,
    2 * Math.PI
  );
  ctx.fillStyle = '#' + colors.ellipseFill;
  ctx.fill();
  ctx.stroke();

  // here's how the artist must trigger the capture, it will use the `default` exporter with the provided resolution
  $objkt.capture();
}

function colorFeatures(color) {
  const rgb = parseInt(color, 16);
  const r = (rgb >> 16) & 0xff;
  const g = (rgb >> 8) & 0xff;
  const b = (rgb >> 0) & 0xff;
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;

  if (lum >= 80 && lum <= 100) {
    return 'shade';
  }
  if (lum < 40) {
    return 'dark';
  }
  return 'light';
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
