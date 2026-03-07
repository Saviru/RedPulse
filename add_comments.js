const fs = require("fs");
const path = require("path");

const uiDir = "components/ui";
const items = fs.readdirSync(uiDir);

for (const item of items) {
  if (item === "Select" || item === "BottomSheetPicker") continue;
  const filePath = path.join(uiDir, item, "index.tsx");
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, "utf-8");

    // Clean up my previous messes
    content = content.replace(/\/\/ Simple .*? component for the UI\n?/g, "");
    content = content.replace(/\/\/ UI Component: .*?\n/g, "");
    content = content.replace(/\n\s*\n/g, "\n\n"); // Fix extra blank lines

    // Add a single clean comment
    const regex = new RegExp(
      `(export\\s+(?:const|function|let|var|default)\\s+${item}\\b)`,
    );
    if (regex.test(content)) {
      content = content.replace(regex, `// Component: ${item}\n$1`);
    } else {
      // Just put it at the very first export const
      content = content.replace(
        /(export\s+(?:const|function|let|var|default))/,
        `// Component: ${item}\n$1`,
      );
    }

    fs.writeFileSync(filePath, content, "utf-8");
  }
}

const layoutsDir = "components/layouts";
if (fs.existsSync(layoutsDir)) {
  const layouts = fs.readdirSync(layoutsDir);
  for (const item of layouts) {
    if (item.endsWith(".tsx") && item !== "index.ts") {
      const compName = item.replace(".tsx", "");
      const filePath = path.join(layoutsDir, item);
      let content = fs.readFileSync(filePath, "utf-8");

      content = content.replace(/\/\/ Core .*? layout component\n/g, "");
      content = content.replace(/\/\/ Layout Component: .*?\n/g, "");
      content = content.replace(/\n\s*\n/g, "\n\n");

      const regex = new RegExp(
        `(export\\s+(?:const|function|let|var|default)\\s+${compName}\\b)`,
      );
      if (regex.test(content)) {
        content = content.replace(
          regex,
          `// Layout Component: ${compName}\n$1`,
        );
      } else {
        content = content.replace(
          /(export\s+(?:const|function|let|var|default))/,
          `// Layout Component: ${compName}\n$1`,
        );
      }

      fs.writeFileSync(filePath, content, "utf-8");
    }
  }
}

console.log("Cleanup Done!");
