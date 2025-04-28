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
  type: "registry:component" | "registry:ui";
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

/**
 * Extracts component props interface from source code
 */
function extractPropsInterface(sourceCode: string): null | string {
  // Common patterns for props interface/type definitions
  const patterns = [
    /interface\s+(\w+Props)\s*{([^}]*)}/gs,
    /type\s+(\w+Props)\s*=\s*{([^}]*)}/gs,
    /interface\s+Props\s*{([^}]*)}/gs,
    /type\s+Props\s*=\s*{([^}]*)}/gs,
  ];

  for (const pattern of patterns) {
    const match = pattern.exec(sourceCode);
    if (match) {
      // Return either the entire interface definition or just the properties
      return match[0] || match[1];
    }
  }

  return null;
}

/**
 * Formats a component name for import statements
 */
function formatComponentName(name: string): string {
  return name.replace(/\s+/g, "");
}

/**
 * Generates an index page for the components
 */
async function generateIndexPage(components: Component[], docsDir: string): Promise<void> {
  const categorized = groupComponentsByCategory(components);

  let content = `---
title: "Components"
description: "Browse all available components in the library"
---

`;

  for (const [category, categoryComponents] of Object.entries(categorized)) {
    content += `## ${category}\n\n`;

    content += categoryComponents
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((c) => `- [${c.title}](/components/${c.name}) - ${c.description}`)
      .join("\n");

    content += "\n\n";
  }

  await writeFile(path.resolve(docsDir, "index.mdx"), content, "utf8");
  console.log("Generated component index page");
}

/**
 * Generates markdown documentation for a component
 */
async function generateMarkdownDocs(component: Component): Promise<string> {
  // Get component source code
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

  const componentName = formatComponentName(component.title);
  const importPath = getComponentImportPath(component);
  const propsInterface = extractPropsInterface(sourceCode);

  const docsImport = `import { ${componentName} } from "${importPath}";`;
  const usageImport = `import { ${componentName} } from "@/components/${component.type === "registry:ui" ? `ui/${component.name}` : component.name}";`;
  const usage = `<${componentName} />`;

  // Generate a better example if we can detect props
  const exampleUsage = propsInterface
    ? `<${componentName} 
  // Add your props here
/>`
    : usage;

  // Generate markdown document
  return `---
title: "${component.title}"
description: "${component.description}"
---

import { Tabs as STabs, TabsContent as STabsContent, TabsList as STabsList, TabsTrigger as STabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
${docsImport}

<STabs defaultValue="preview">
  <STabsList>
    <STabsTrigger value="preview">Preview</STabsTrigger>
    <STabsTrigger value="code">Code</STabsTrigger>
  </STabsList>
  <STabsContent value="preview">
    <Card>
      <CardContent className="grid place-content-center min-h-96">
        ${usage}
      </CardContent>
    </Card>
  </STabsContent>
  <STabsContent value="code">
\`\`\`tsx
${sourceCode.trim()}
\`\`\`
  </STabsContent>
</STabs>

## Installation

\`\`\`package-install
npx shadcn@latest add https://registry.fasu.dev/r/${component.name}.json
\`\`\`

## Usage

\`\`\`tsx
${usageImport}

export default function Example() {
  return ${exampleUsage}
}
\`\`\`

${propsInterface ? `## Props\n\n\`\`\`tsx\n${propsInterface}\n\`\`\`\n\n` : ""}
${component.docs ? component.docs : ""}

## Dependencies

${
  component.dependencies.length > 0
    ? `This component depends on:\n\n${component.dependencies.map((dep) => `- \`${dep}\``).join("\n")}`
    : "This component has no dependencies."
}
`;
}

/**
 * Generates the import path for a component
 */
function getComponentImportPath(component: Component): string {
  const file = component.files.find((c) => c.path.endsWith(`${component.name}.tsx`));

  if (!file) {
    return `@/components/${component.type === "registry:ui" ? `ui/${component.name}` : component.name}`;
  }

  return file.path.replace("src/", "@/").replace(".tsx", "");
}

/**
 * Groups components by category for better organization
 */
function groupComponentsByCategory(components: Component[]): Record<string, Component[]> {
  const categorized: Record<string, Component[]> = {
    Components: [],
    UI: [],
    Uncategorized: [],
  };

  components.forEach((component) => {
    if (component.type === "registry:ui") {
      categorized["UI"].push(component);
    } else if (component.type === "registry:component") {
      categorized["Components"].push(component);
    } else if (component.categories && component.categories.length > 0) {
      const category = component.categories[0];
      if (!categorized[category]) {
        categorized[category] = [];
      }
      categorized[category].push(component);
    } else {
      categorized["Uncategorized"].push(component);
    }
  });

  // Remove empty categories
  return Object.fromEntries(
    Object.entries(categorized).filter(([_, components]) => components.length > 0),
  );
}

/**
 * Main function to run the script
 */
async function main() {
  try {
    console.log("Starting documentation generation...");

    // Read and parse registry.json
    const registryPath = path.resolve(process.cwd(), "registry.json");
    const registryContent = await readFile(registryPath, "utf8");
    const registry: Registry = JSON.parse(registryContent);

    // Filter for components
    const components = registry.items.filter(
      (item) => item.type === "registry:component" || item.type === "registry:ui",
    );

    if (components.length === 0) {
      console.log("No components found in registry.json");
      return;
    }

    console.log(`Found ${components.length} components to document`);

    // Create docs directory
    const docsDir = path.resolve(process.cwd(), "src/content/components");

    // Remove docs directory if it exists
    try {
      await fs.promises.rm(docsDir, { recursive: true });
      console.log("Removed existing docs directory");
    } catch (err) {
      // Ignore error if directory doesn't exist
      if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
        throw err;
      }
    }

    try {
      await mkdir(docsDir, { recursive: true });
      console.log("Created docs directory");
    } catch (err) {
      // Ignore error if directory already exists
      if ((err as NodeJS.ErrnoException).code !== "EEXIST") {
        throw err;
      }
    }

    // Generate and write markdown docs for each component
    const promises = components.map(async (component) => {
      const markdown = await generateMarkdownDocs(component);
      const docPath = path.resolve(docsDir, `${component.name}.mdx`);
      await writeFile(docPath, markdown, "utf8");
      console.log(`Generated docs for ${component.name}`);
    });

    // Wait for all documentation to be generated
    await Promise.all(promises);

    // Generate index page
    await generateIndexPage(components, docsDir);

    // Create a meta.json
    const metaPath = path.resolve(process.cwd(), "scripts", "meta.json");
    const metaContent = await readFile(metaPath, "utf-8");
    await writeFile(path.resolve(docsDir, "meta.json"), metaContent);
    console.log("Created meta.json file");

    console.log("Documentation generation completed successfully!");
  } catch (error) {
    console.error("Error generating documentation:", error);
    process.exit(1);
  }
}

// Run the script
main();
