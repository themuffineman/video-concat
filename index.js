const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const hooksDir = "./hooks";
const bodiesDir = "./bodies";
const tempDir = "./temp";
const outputDir = "./output";

// Ensure output and temp folders exist
for (const dir of [tempDir, outputDir]) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);
}

// Helper to normalize video to 1280x720, 30fps, H.264, AAC
function normalizeVideo(inputPath, outputPath) {
  execSync(
    `ffmpeg -i "${inputPath}" -vf "fps=30,scale=w=1024:h=-2:force_original_aspect_ratio=decrease,pad=1024:1920:(ow-iw)/2:(oh-ih)/2,setsar=1" \
-ar 44100 -ac 2 -c:v libx264 -preset slow -crf 18 \
-c:a aac -b:a 192k -y "${outputPath}"`,
    { stdio: "inherit" }
  );
}

// Helper to concatenate two videos
function concatVideos(hookPath, bodyPath, outputPath) {
  const filter = "[0:v:0][0:a:0][1:v:0][1:a:0]concat=n=2:v=1:a=1[outv][outa]";
  const command = `ffmpeg -i "${hookPath}" -i "${bodyPath}" -filter_complex "${filter}" -map "[outv]" -map "[outa]" -c:v libx264 -preset slow -crf 18 -c:a aac -b:a 192k -y "${outputPath}"`;
  execSync(command, { stdio: "inherit" });
}

// Read hook and body videos
const hooks = fs.readdirSync(hooksDir).filter((f) => f.endsWith(".mp4"));
const bodies = fs.readdirSync(bodiesDir).filter((f) => f.endsWith(".mp4"));

// Loop over combinations
hooks.forEach((hook, i) => {
  bodies.forEach((body, j) => {
    // if (j > 1) {
    //   return;
    // }
    const hookInput = path.join(hooksDir, hook);
    const bodyInput = path.join(bodiesDir, body);

    const normalizedHook = path.join(tempDir, `hook_${i}.mp4`);
    const normalizedBody = path.join(tempDir, `body_${j}.mp4`);

    const outputFilename = `video_${i + 1}_${j + 1}.mp4`;
    const outputPath = path.join(outputDir, outputFilename);

    console.log(`\n🎬 Processing: ${hook} + ${body} -> ${outputFilename}`);

    // Normalize both inputs
    normalizeVideo(hookInput, normalizedHook);
    normalizeVideo(bodyInput, normalizedBody);

    // Concatenate into final video
    concatVideos(normalizedHook, normalizedBody, outputPath);

    console.log(`✅ Created: ${outputFilename}`);
  });
});
