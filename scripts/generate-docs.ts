import fs from "fs";
import path from "path";
import { promisify } from "util";

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);

type Component = {
  author: string;
  categories: string[];
  dependencies: string[];
  description: string;
  docs: string;
  files: ComponentFile[];
  name: string;
  registryDependencies: string[];
  title: string;
  type: string;
};

type ComponentFile = {
  path: string;
  type: string;
};

type Registry = {
  $schema: string;
  homepage: string;
  items: Component[];
  name: string;
};

async function generateMarkdownDocs(component: Component): Promise<string> {
  // Get component source code from the first file path
  let sourceCode = "";
  if (component.files && component.files.length > 0) {
    try {
      const filePath = component.files[0].path;
      sourceCode = await readFile(filePath, "utf-8");
    } catch (error) {
      console.error(`Failed to read file for ${component.name}:`, error);
      sourceCode = "// Component source code not available";
    }
  }

  // Format dependencies for display
  const dependencies = component.dependencies?.length
    ? `- ${component.dependencies.join("\n- ")}`
    : "None";

  const registryDependencies = component.registryDependencies?.length
    ? `- ${component.registryDependencies.join("\n- ")}`
    : "None";

  // Generate markdown document
  return `---
title: "${component.title}"
description: "${component.description}"
---

${component.docs ? `## Usage\n${component.docs}` : ""}

## Dependencies

### npm packages
${dependencies}

### Registry dependencies
${registryDependencies}

## Categories
${component.categories?.map((cat) => `- ${cat}`).join("\n") || "None specified"}

## Source Code

\`\`\`tsx
${sourceCode}
\`\`\`

## Author

${component.author || "Not specified"}
`;
}

async function main() {
  try {
    // Read and parse registry.json
    const registryPath = path.resolve(process.cwd(), "registry.json");
    const registryContent = await readFile(registryPath, "utf8");
    const registry: Registry = JSON.parse(registryContent);

    // Filter for components (type = "registry:component")
    const components = registry.items.filter((item) => item.type === "registry:component");

    if (components.length === 0) {
      console.log("No components found in registry.json");
      return;
    }

    // Create docs directory if it doesn't exist
    const docsDir = path.resolve(process.cwd(), "src/content/components");

    // Remove docs directory if it exists
    try {
      await fs.promises.rm(docsDir, { recursive: true });
    } catch (err) {
      // Ignore error if directory doesn't exist
      if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
        throw err;
      }
    }

    try {
      await mkdir(docsDir, { recursive: true });
    } catch (err) {
      // Ignore error if directory already exists
      if ((err as NodeJS.ErrnoException).code !== "EEXIST") {
        throw err;
      }
    }

    // Generate and write markdown docs for each component
    for (const component of components) {
      const markdown = await generateMarkdownDocs(component);
      const docPath = path.resolve(docsDir, `${component.name}.md`);
      await writeFile(docPath, markdown, "utf8");
      console.log(`Generated docs for ${component.name} at ${docPath}`);
    }

    // Update layout config
    await updateLayoutConfig(components);

    // Create a meta.json
    const metaPath = path.resolve(process.cwd(), "scripts", "meta.json");
    const metaContent = await readFile(metaPath, "utf-8");
    await writeFile(path.resolve(docsDir, "meta.json"), metaContent);

    console.log("Documentation generation completed successfully!");
  } catch (error) {
    console.error("Error generating documentation:", error);
    process.exit(1);
  }
}

async function updateLayoutConfig(components: Component[]): Promise<void> {
  if (!components.length) return;

  const configPath = path.resolve(process.cwd(), "src/app/layout.config.tsx");

  try {
    // Read the current layout config
    let configContent = await readFile(configPath, "utf8");

    // Get the first component's name for the default URL
    const firstComponentUrl = `/components/${components[0].name}`;

    // Update the URL in the Components link
    configContent = configContent.replace(
      /url: "(.*?)",\s*\/\/ auto generate by scripts\/generate-docs\.ts/,
      `url: "${firstComponentUrl}", // auto generate by scripts/generate-docs.ts`,
    );

    // Write the updated config back to file
    await writeFile(configPath, configContent, "utf8");
    console.log(`Updated layout config with first component URL: ${firstComponentUrl}`);
  } catch (error) {
    console.error("Failed to update layout config:", error);
    throw error;
  }
}

main();
