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
 * Creates an example usage based on props detected
 */
function createExampleUsage(
  componentName: string,
  propsInterface: null | string,
  sourceCode: string,
): string {
  // Check if we have usage examples in comments first
  const usageExample = extractUsageExample(sourceCode);
  if (usageExample) {
    // Extract just the TSX portion if it's in a full component
    const jsxMatch = usageExample.match(/<([^>]*|[^<]*<[^>]*>[^<]*)>/s);
    if (jsxMatch) {
      return jsxMatch[0];
    }
    return usageExample;
  }

  // If no usage example, generate one based on props
  if (!propsInterface) {
    return `<${componentName} />`;
  }

  const defaultProps = extractDefaultProps(sourceCode);
  const propDetails = extractPropDetails(propsInterface);

  if (propDetails.length === 0) {
    return `<${componentName} />`;
  }

  // Generate example with props
  return `<${componentName}
  ${propDetails
    .map((prop) => {
      const propName = prop.name;

      // Use default values if available
      if (defaultProps[propName]) {
        return `${propName}=${defaultProps[propName]}`;
      }

      // Otherwise generate a sensible value based on prop name and type
      if (prop.type.includes("boolean")) {
        if (
          propName.startsWith("is") ||
          propName.includes("enabled") ||
          propName.includes("active") ||
          propName.includes("visible")
        ) {
          return `${propName}={true}`;
        }
        if (propName.includes("disabled")) {
          return `${propName}={false}`;
        }
        return `${propName}={false}`;
      }

      if (prop.type.includes("string")) {
        if (propName.includes("class") || propName === "className") {
          return `${propName}="p-4 border rounded"`;
        }
        if (propName.includes("children")) {
          return `${propName}="Content goes here"`;
        }
        if (propName.includes("id")) {
          return `${propName}="example-id"`;
        }
        return `${propName}="example"`;
      }

      if (prop.type.includes("number")) {
        return `${propName}={10}`;
      }

      if (prop.type.includes("array") || prop.type.includes("[]")) {
        return `${propName}={[]}`;
      }

      if (prop.type.includes("object") || prop.type.includes("{}")) {
        return `${propName}={{}}`;
      }

      // For function props
      if (prop.type.includes("function") || prop.type.includes("=>")) {
        return `${propName}={() => {}}`;
      }

      return `${propName}={/* Add your ${propName} */}`;
    })
    .join("\n  ")}
/>`;
}

/**
 * Extract default props from source code
 */
function extractDefaultProps(sourceCode: string): Record<string, string> {
  const defaultProps: Record<string, string> = {};

  // Look for default props in parameters
  const defaultPropsRegex = /(\w+)\s*=\s*([^,)]+)/g;
  const functionParamsRegex = /function\s+\w+\(\s*{\s*([^}]*)\s*}/;
  const paramsMatch = sourceCode.match(functionParamsRegex);

  if (paramsMatch && paramsMatch[1]) {
    const params = paramsMatch[1];
    let match;

    while ((match = defaultPropsRegex.exec(params)) !== null) {
      defaultProps[match[1]] = match[2].trim();
    }
  }

  // Look for constants that might be default values
  const defaultConstRegex = /const\s+DEFAULT_(\w+)\s*=\s*([^;]+)/g;
  let constMatch;

  while ((constMatch = defaultConstRegex.exec(sourceCode)) !== null) {
    const propName = constMatch[1].toLowerCase();
    defaultProps[propName] = constMatch[2].trim();
  }

  return defaultProps;
}

/**
 * Extracts prop names and types from a props interface
 */
function extractPropDetails(
  propsInterface: string,
): Array<{ name: string; required: boolean; type: string }> {
  if (!propsInterface) return [];

  const props: Array<{ name: string; required: boolean; type: string }> = [];

  // Extract everything between curly braces
  const propsBodyMatch = propsInterface.match(/{([^}]*)}/s);
  if (!propsBodyMatch) return props;

  const propsBody = propsBodyMatch[1];

  // Split by line and process each property
  const propLines = propsBody
    .split(/\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("//"));

  for (const line of propLines) {
    // Match property name, optional marker, and type
    const propMatch = line.match(/(\w+)(\?)?:\s*([^;]+)/);
    if (propMatch) {
      props.push({
        name: propMatch[1],
        required: !propMatch[2], // If there's no question mark, it's required
        type: propMatch[3].trim(),
      });
    }
  }

  return props;
}

/**
 * Extracts component props interface from source code
 */
function extractPropsInterface(sourceCode: string): null | string {
  // Common patterns for props interface/type definitions
  const patterns = [
    // Original patterns
    /interface\s+(\w+Props)\s*{([^}]*)}/gs,
    /type\s+(\w+Props)\s*=\s*{([^}]*)}/gs,
    /interface\s+Props\s*{([^}]*)}/gs,
    /type\s+Props\s*=\s*{([^}]*)}/gs,

    // Add support for ComponentProps pattern
    /type\s+(\w+Props)\s*=\s*ComponentProps<[^>]*>\s*&\s*{([^}]*)}/gs,
    /type\s+Props\s*=\s*ComponentProps<[^>]*>\s*&\s*{([^}]*)}/gs,
    /interface\s+(\w+Props)\s*extends\s+ComponentProps<[^>]*>\s*{([^}]*)}/gs,
    /interface\s+Props\s*extends\s+ComponentProps<[^>]*>\s*{([^}]*)}/gs,

    // Support for HTMLAttributes pattern as well
    /type\s+(\w+Props)\s*=\s*HTMLAttributes<[^>]*>\s*&\s*{([^}]*)}/gs,
    /type\s+Props\s*=\s*HTMLAttributes<[^>]*>\s*&\s*{([^}]*)}/gs,
    /interface\s+(\w+Props)\s*extends\s*HTMLAttributes<[^>]*>\s*{([^}]*)}/gs,
    /interface\s+Props\s*extends\s*HTMLAttributes<[^>]*>\s*{([^}]*)}/gs,

    // Support for React.ComponentProps pattern
    /type\s+(\w+Props)\s*=\s*React\.ComponentProps<[^>]*>\s*&\s*{([^}]*)}/gs,
    /type\s+Props\s*=\s*React\.ComponentProps<[^>]*>\s*&\s*{([^}]*)}/gs,
    /interface\s+(\w+Props)\s*extends\s+React\.ComponentProps<[^>]*>\s*{([^}]*)}/gs,
    /interface\s+Props\s*extends\s+React\.ComponentProps<[^>]*>\s*{([^}]*)}/gs,
  ];

  for (const pattern of patterns) {
    const match = pattern.exec(sourceCode);
    if (match) {
      // Return the entire interface/type definition
      return match[0];
    }
  }

  // If we didn't find a match with our specific patterns, try a more general approach
  // for handling more complex prop definitions
  const componentPropsMatches = sourceCode.match(
    /(type|interface)\s+(\w+Props|Props)\s*=?\s*([^;]*?{[^{}]*})/gs,
  );
  if (componentPropsMatches && componentPropsMatches.length > 0) {
    return componentPropsMatches[0];
  }

  // Check for inline types in function parameters
  const inlinePropsMatch = sourceCode.match(
    /function\s+\w+\(\s*{\s*([^}]*)\s*}(\s*:\s*\w+)?\s*\)/s,
  );

  if (inlinePropsMatch) {
    return `type Props = {\n  ${inlinePropsMatch[1].trim()}\n}`;
  }

  return null;
}

/**
 * Extract standalone type definitions that might be related to props
 */
function extractTypeDefinitions(sourceCode: string): string[] {
  const typeDefinitions: string[] = [];
  const typeRegex = /(type|interface)\s+\w+\s*=?\s*([^;]*?{[^{}]*})/gs;

  let match;
  while ((match = typeRegex.exec(sourceCode)) !== null) {
    // Only push if it looks like a type definition
    if (match[0].includes("{") && match[0].includes("}")) {
      typeDefinitions.push(match[0]);
    }
  }

  return typeDefinitions;
}

/**
 * Extracts component usage examples from comments in source code
 */
function extractUsageExample(sourceCode: string): null | string {
  // Look for usage examples in comments
  const usageCommentRegex = /\/\*\s*Usage:([\s\S]*?)\*\//;
  const usageComment = sourceCode.match(usageCommentRegex);

  if (usageComment && usageComment[1]) {
    return usageComment[1].trim();
  }

  // Try to find example code snippets
  const exampleRegex = /\/\*\s*Example:([\s\S]*?)\*\//;
  const example = sourceCode.match(exampleRegex);

  if (example && example[1]) {
    return example[1].trim();
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
title: "All Components"
description: "Browse all available components in the collection"
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

  // Extract props interface more intelligently
  const propsInterface = extractPropsInterface(sourceCode);

  // Check for additional type definitions that might be useful
  const typeDefinitions = extractTypeDefinitions(sourceCode);

  const docsImport = `import { ${componentName} } from "${importPath}";`;
  const usageImport = `import { ${componentName} } from "@/components/${component.type === "registry:ui" ? `ui/${component.name}` : component.name}";`;

  // Generate example usage based on props
  const exampleUsage = createExampleUsage(componentName, propsInterface, sourceCode);

  // For the preview, use a simpler version
  const previewUsage = exampleUsage.includes("\n") ? `<${componentName} />` : exampleUsage;

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
        ${previewUsage}
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
${
  typeDefinitions.length > 0 && !propsInterface
    ? `## Types\n\n\`\`\`tsx\n${typeDefinitions.join("\n\n")}\n\`\`\`\n\n`
    : ""
}
${component.docs ? component.docs : ""}

${
  component.dependencies.length > 0
    ? `## Dependencies\n\nThis component depends on:\n\n${component.dependencies.map((dep) => `- \`${dep}\``).join("\n")}`
    : ""
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

    console.log("Documentation generation completed successfully!");
  } catch (error) {
    console.error("Error generating documentation:", error);
    process.exit(1);
  }
}

// Run the script
main();
