const Jimp = require('jimp'); // 恢复旧版引入方式
const { GifUtil } = require('gifwrap');
const fs = require('fs');

const CONFIG = {
    input: './action.gif',
    outputSize: 16,
    palette: [
        { char: 'b', color: { r: 255, g: 152, b: 0 } },
        { char: 'e', color: { r: 255, g: 245, b: 157 } },
        { char: 'w', color: { r: 255, g: 183, b: 77 } },
        { char: 'k', color: { r: 33, g: 33, b: 33 } },
        { char: 'W', color: { r: 255, g: 255, b: 255 } },
        { char: 'h', color: { r: 255, g: 167, b: 38 } },
        { char: 'm', color: { r: 229, g: 57, b: 53 } },
        { char: 'p', color: { r: 244, g: 143, b: 177 } },
    ]
};

function getColorDistance(c1, c2) {
    return Math.sqrt(
        Math.pow(c1.r - c2.r, 2) + Math.pow(c1.g - c2.g, 2) + Math.pow(c1.b - c2.b, 2)
    );
}

function getNearestChar(pixel) {
    if (pixel.a < 128) return '.';
    let minDistance = Infinity;
    let bestChar = 'b';
    for (const item of CONFIG.palette) {
        const dist = getColorDistance(pixel, item.color);
        if (dist < minDistance) {
            minDistance = dist;
            bestChar = item.char;
        }
    }
    return bestChar;
}

async function convert() {
    try {
        const gif = await GifUtil.read(CONFIG.input);
        const framesCode = [];
        for (let i = 0; i < gif.frames.length; i++) {
            const frame = gif.frames[i];
            const jimpImage = GifUtil.copyAsJimp(Jimp, frame);
            jimpImage.resize(CONFIG.outputSize, CONFIG.outputSize, Jimp.RESIZE_NEAREST_NEIGHBOR);
            let frameLines = [];
            for (let y = 0; y < CONFIG.outputSize; y++) {
                let line = "";
                for (let x = 0; x < CONFIG.outputSize; x++) {
                    const color = jimpImage.getPixelColor(x, y);
                    const rgba = Jimp.intToRGBA(color);
                    line += getNearestChar(rgba);
                }
                frameLines.push(`      '${line}',`);
            }
            framesCode.push(`    [\n${frameLines.join('\n')}\n    ],`);
        }
        const fullCode = `  action: [\n${framesCode.join('\n')}\n  ],`;
        fs.writeFileSync('converted_frames.txt', fullCode);
        console.log("SUCCESS");
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
convert();
