const fs = require('fs');
const os = require('os');
const path = require('path');
const OpenAI = require('openai');
const { toFile } = require('openai/uploads');
const { Jimp, JimpMime, HorizontalAlign, VerticalAlign } = require('jimp');

const SUPPORTED_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp']);
const DEFAULT_PROMPT =
  'Turn this image into a warm 2D animated storybook cartoon portrait. Keep the subject recognizable, including face, hairstyle, expression, pose, and clothing details. Use clean outlines, soft shading, appealing colors, and a polished family-film look. Avoid text, watermarks, extra fingers, extra limbs, distorted faces, and messy backgrounds.';
const PREP_SIZE = 1024;

function printHelp() {
  console.log(`
Usage:
  npm run cartoonize:batch -- --input <folder> [--output <folder>] [--prompt "<text>"]

Options:
  --input,  -i   Folder with source images. Required.
  --output, -o   Folder for generated images. Default: <input>/cartoonized
  --prompt, -p   Custom prompt. Supports multi-word values.
  --model        Edit model. Default: dall-e-2
  --size         Edit output size. Default: 1024x1024
  --suffix       Filename suffix. Default: -cartoon
  --help,   -h   Show this help message.

Environment:
  OPENAI_API_KEY must be set before running the script.

Notes:
  The DALL-E 2 edit endpoint expects square PNG inputs under 4MB. This script preprocesses each image onto a white 1024x1024 PNG canvas before upload.
`);
}

function readValue(argv, startIndex) {
  const first = argv[startIndex + 1];
  if (!first || first.startsWith('--')) {
    throw new Error(`Missing value for ${argv[startIndex]}`);
  }

  const parts = [first];
  let nextIndex = startIndex + 1;

  while (argv[nextIndex + 1] && !argv[nextIndex + 1].startsWith('--')) {
    parts.push(argv[nextIndex + 1]);
    nextIndex += 1;
  }

  return { value: parts.join(' '), nextIndex };
}

function parseArgs(argv) {
  const options = {
    model: 'dall-e-2',
    size: '1024x1024',
    suffix: '-cartoon',
    prompt: DEFAULT_PROMPT,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    if (arg === '--help' || arg === '-h') {
      options.help = true;
      continue;
    }

    if (arg === '--input' || arg === '-i') {
      const { value, nextIndex } = readValue(argv, i);
      options.input = value;
      i = nextIndex;
      continue;
    }

    if (arg === '--output' || arg === '-o') {
      const { value, nextIndex } = readValue(argv, i);
      options.output = value;
      i = nextIndex;
      continue;
    }

    if (arg === '--prompt' || arg === '-p') {
      const { value, nextIndex } = readValue(argv, i);
      options.prompt = value;
      i = nextIndex;
      continue;
    }

    if (arg === '--model') {
      const { value, nextIndex } = readValue(argv, i);
      options.model = value;
      i = nextIndex;
      continue;
    }

    if (arg === '--size') {
      const { value, nextIndex } = readValue(argv, i);
      options.size = value;
      i = nextIndex;
      continue;
    }

    if (arg === '--suffix') {
      const { value, nextIndex } = readValue(argv, i);
      options.suffix = value;
      i = nextIndex;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function listSourceImages(inputDir) {
  return fs
    .readdirSync(inputDir)
    .filter((name) => SUPPORTED_EXTENSIONS.has(path.extname(name).toLowerCase()))
    .sort((a, b) => a.localeCompare(b));
}

function getOutputPath(outputDir, fileName, suffix) {
  const parsed = path.parse(fileName);
  return path.join(outputDir, `${parsed.name}${suffix}.png`);
}

async function prepareSquarePng(inputPath, fileName) {
  const image = await Jimp.read(inputPath);
  const canvas = new Jimp({ width: PREP_SIZE, height: PREP_SIZE, color: 0xffffffff });

  image.contain({
    w: PREP_SIZE,
    h: PREP_SIZE,
    align: HorizontalAlign.CENTER | VerticalAlign.MIDDLE,
    mode: Jimp.RESIZE_BILINEAR,
  });

  canvas.composite(image, 0, 0);

  const tempPath = path.join(os.tmpdir(), `${path.parse(fileName).name}-${Date.now()}.png`);
  const pngBuffer = await canvas.getBuffer(JimpMime.png);
  fs.writeFileSync(tempPath, pngBuffer);
  return tempPath;
}

async function generateEditedImage(client, preparedImagePath, options) {
  const preparedBuffer = fs.readFileSync(preparedImagePath);
  const preparedFile = await toFile(preparedBuffer, 'input.png', { type: 'image/png' });
  const maskImage = new Jimp({ width: PREP_SIZE, height: PREP_SIZE, color: 0x00000000 });
  const maskBuffer = await maskImage.getBuffer(JimpMime.png);
  const maskFile = await toFile(maskBuffer, 'mask.png', { type: 'image/png' });

  const response = await client.images.edit({
    model: options.model,
    image: preparedFile,
    mask: maskFile,
    prompt: options.prompt,
    size: options.size,
    response_format: 'b64_json',
  });

  const imageBase64 = response.data && response.data[0] && response.data[0].b64_json;
  if (!imageBase64) {
    throw new Error('No image data returned from OpenAI.');
  }

  return imageBase64;
}

async function run() {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    printHelp();
    return;
  }

  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not set.');
  }

  if (!options.input) {
    throw new Error('--input is required.');
  }

  const inputDir = path.resolve(options.input);
  const outputDir = path.resolve(options.output || path.join(inputDir, 'cartoonized'));

  if (!fs.existsSync(inputDir) || !fs.statSync(inputDir).isDirectory()) {
    throw new Error(`Input folder not found: ${inputDir}`);
  }

  const files = listSourceImages(inputDir);
  if (files.length === 0) {
    throw new Error(`No supported images found in ${inputDir}`);
  }

  ensureDir(outputDir);

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  console.log(`Processing ${files.length} image(s) from ${inputDir}`);
  console.log(`Writing outputs to ${outputDir}`);

  for (const fileName of files) {
    const inputPath = path.join(inputDir, fileName);
    const outputPath = getOutputPath(outputDir, fileName, options.suffix);
    let preparedImagePath;

    try {
      console.log(`\nEditing ${fileName}...`);
      preparedImagePath = await prepareSquarePng(inputPath, fileName);
      const imageBase64 = await generateEditedImage(client, preparedImagePath, options);
      fs.writeFileSync(outputPath, Buffer.from(imageBase64, 'base64'));
      console.log(`Saved ${path.basename(outputPath)}`);
    } finally {
      if (preparedImagePath && fs.existsSync(preparedImagePath)) {
        fs.unlinkSync(preparedImagePath);
      }
    }
  }

  console.log('\nBatch complete.');
}

run().catch((error) => {
  console.error(`\nError: ${error.message}`);
  process.exit(1);
});
