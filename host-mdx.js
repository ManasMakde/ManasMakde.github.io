import path from "path";
import fs from "fs";


// Properties
const INDEX_FOLDER = "/index";


// Utility Methods
function moveUpContents(folderPath) {

    // Get parent directory
    const targetDir = path.resolve(folderPath);
    const parentDir = path.dirname(targetDir);
    const items = fs.readdirSync(targetDir);


    // Move all items up to parent directory
    items.forEach((item) => {
        const oldPath = path.join(targetDir, item);
        const newPath = path.join(parentDir, item);
        fs.renameSync(oldPath, newPath);
    });


    // Remove the empty directory
    fs.rmdirSync(targetDir);
}


// Hook Methods
export function modBundleMDXSettings(inputPath, outputPath, settings) {

    // Build options
    var oldBuildOptions = settings.esbuildOptions;
    settings.esbuildOptions = (options) => {
        options = oldBuildOptions(options)
        options.logLevel = 'error';
        options.alias = {
            ...options.alias,
            '@': inputPath, // Maps '@' to your project root
        };

        return options;
    }


    return settings
}
export async function onSiteCreateEnd(inputPath, outputPath, wasInterrupted) {
    // Return if site was interrupted while creating
    if (wasInterrupted) {
        return;
    }


    // Move up all files from index folder
    moveUpContents(path.join(outputPath, INDEX_FOLDER));
}
