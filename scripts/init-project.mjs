import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const appPaths = {
  serverPkg: "apps/server/package.json",
  webPkg: "apps/web/package.json",
  rootPkg: "package.json",
  tuyauClient: "apps/web/src/lib/tuyau.ts",
  sharedPkg: "apps/shared/package.json",
};

const question = (query) =>
  new Promise((resolve) => rl.question(query, resolve));

(async () => {
  console.log("🚀 Initializing new Monorepo...");

  const projectName = await question(
    "What is the project name (e.g., my-saas)? ",
  );
  const scopeName = await question("What is the scope name (e.g., @org)? ");

  const fullServerName = `${scopeName}/server`;
  const fullWebName = `${scopeName}/web`;
  const fullSharedName = `${scopeName}/shared`;

  console.log(
    `\n⚙️  Configuring packages as: ${fullServerName} & ${fullWebName}...`,
  );

  updateJson(appPaths.serverPkg, (json) => {
    json.name = fullServerName;
    if (json.dependencies) {
      const oldKeys = Object.keys(json.dependencies).filter((k) =>
        k.includes("@acme/shared"),
      );
      oldKeys.forEach((k) => delete json.dependencies[k]);
      json.dependencies[fullServerName] = "workspace:*";
    }
  });

  updateJson(appPaths.webPkg, (json) => {
    json.name = fullWebName;
    if (json.dependencies) {
      // Remove old ref and add new one
      const oldKeys = Object.keys(json.dependencies).filter(
        (k) => k.includes("/server") || k.includes("server"),
      );
      oldKeys.forEach((k) => delete json.dependencies[k]);
      json.dependencies[fullServerName] = "workspace:*";
    }
  });

  updateJson(appPaths.rootPkg, (json) => {
    json.name = projectName;
  });

  updateJson(appPaths.sharedPkg, (json) => {
    json.name = fullSharedName;
  });

  updateFileContent(appPaths.tuyauClient, (content) => {
    // Regex explanation:
    // Matches: import { api } from 'ANY_STRING/api'
    // Replaces with: import { api } from '@new-scope/server/api'
    const importRegex = /import\s+\{\s*api\s*\}\s+from\s+['"](.*)\/api['"]/g;

    if (!importRegex.test(content)) {
      console.warn(
        `⚠️  Warning: Could not find "import { api }..." in ${appPaths.tuyauClient}`,
      );
      return content;
    }

    return content.replace(
      importRegex,
      `import { api } from '${fullServerName}/api'`,
    );
  });

  console.log(
    `\n✅ Renamed packages to ${fullServerName}, ${fullWebName}, and ${fullSharedName}`,
  );
  console.log(`👉 Run 'pnpm install' to link the workspaces.`);

  rl.close();
})();

function updateJson(filePath, updateFn) {
  const fullPath = path.resolve(process.cwd(), filePath);
  if (fs.existsSync(fullPath)) {
    const content = JSON.parse(fs.readFileSync(fullPath, "utf8"));
    updateFn(content);
    fs.writeFileSync(fullPath, JSON.stringify(content, null, 2));
  }
}

function updateFileContent(filePath, updateFn) {
  const fullPath = path.resolve(process.cwd(), filePath);
  if (fs.existsSync(fullPath)) {
    try {
      const content = fs.readFileSync(fullPath, "utf8");
      const newContent = updateFn(content);
      fs.writeFileSync(fullPath, newContent);
      console.log(`   Updated ${filePath}`);
    } catch (error) {
      console.error(`   ❌ Error updating ${filePath}:`, error.message);
    }
  } else {
    console.error(`   ❌ File not found: ${filePath}`);
  }
}
