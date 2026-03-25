const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');

const SUPPORTED_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp']);
const DEFAULT_PROMPT =
  'Turn this image into a warm 2D animated storybook cartoon portrait. Keep the subject recognizable, including face, hairstyle, expression, pose, and clothing details. Use clean outlines, soft shading, appealing colors, and a polished family-film look. Avoid text, watermarks, extra fingers, extra limbs, distorted faces, and messy backgrounds.';

function printHelp() {
  console.log(`
Usage:
  npm run cartoonize:batch -- --input <folder> [--output <folder>] [--prompt "<text>"]

Options:
  --input,  -i   Folder with source images. Required.
  --output, -o   Folder for generated images. Default: <input>/cartoonized
  --prompt, -p   Custom edit prompt.
  --model        OpenAI image model. Default: gpt-image-1
  --size         Output size. Default: 1024x1024
  --quality      Output quality. Default: medium
  --format       png, jpeg, or webp. Default: png
  --fidelity     low or high source-image fidelity. Default: high
  --suffix       Filename suffix. Default: -cartoon
  --help,   -h   Show this help message.

Environment:
  OPENAI_API_KEY must be set before running the script.

Example:
  npm run cartoonize:batch -- --input .\\photos --output .\\cartoons
`);
}

function parseArgs(argv) {
  const options = {
    model: 'gpt-image-1',
    size: '1024x1024',
    quality: 'medium',
    format: 'png',
    fidelity: 'high',
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
      options.input = argv[++i];
      continue;
    }

    if (arg === '--output' || arg === '-o') {
      options.output = argv[++i];
      continue;
    }

    if (arg === '--prompt' || arg === '-p') {
      options.prompt = argv[++i];
      continue;
    }

    if (arg === '--model') {
      options.model = argv[++i];
      continue;
    }

    if (arg === '--size') {
      options.size = argv[++i];
      continue;
    }

    if (arg === '--quality') {
      options.quality = argv[++i];
      continue;
    }

    if (arg === '--format') {
      options.format = argv[++i];
      continue;
    }

    if (arg === '--fidelity') {
      options.fidelity = argv[++i];
      continue;
    }

    if (arg === '--suffix') {
      options.suffix = argv[++i];
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

function getOutputPath(outputDir, fileName, suffix, format) {
  const parsed = path.parse(fileName);
  return path.join(outputDir, `${parsed.name}${suffix}.${format}`);
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
    const outputPath = getOutputPath(outputDir, fileName, options.suffix, options.format);

    console.log(`\nEditing ${fileName}...`);

    const result = await client.images.edit({
      model: options.model,
      image: fs.createReadStream(inputPath),
      prompt: options.prompt,
      size: options.size,
      quality: options.quality,
      output_format: options.format,
      input_fidelity: options.fidelity,
    });

    const imageBase64 = result.data && result.data[0] && result.data[0].b64_json;

    if (!imageBase64) {
      throw new Error(`No image data returned for ${fileName}`);
    }

    fs.writeFileSync(outputPath, Buffer.from(imageBase64, 'base64'));
    console.log(`Saved ${path.basename(outputPath)}`);
  }

  console.log('\nBatch complete.');
}

run().catch((error) => {
  console.error(`\nError: ${error.message}`);
  process.exit(1);
});
